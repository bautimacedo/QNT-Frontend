<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { AlertTriangle, Image as ImageIcon, X, Trash2, UploadCloud, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { apiClient, fetchBlobObjectUrl } from '../../../api/termica'
import { useElectricoWizard } from '../../../composables/useTermicaWizard'

const wizard = useElectricoWizard()
const manifest = wizard.state.manifest
const batchId = wizard.state.batchId

// thumbnail blob URLs (necesitan el header X-API-Key, no se pueden usar
// directo en <img src>)
const thumbUrls = ref({}) // image_id -> blobUrl

function imageById(imageId) {
  return manifest.images.find((i) => i.image_id === imageId)
}

async function loadThumb(image) {
  if (!image || thumbUrls.value[image.image_id]) return
  thumbUrls.value[image.image_id] = await fetchBlobObjectUrl(image.thumbnail_url)
}

onMounted(async () => {
  for (const img of manifest.images) await loadThumb(img)
})

// Una "tarjeta" es un par en formación: thermalImage y/o visualImage pueden
// estar ausentes temporalmente (térmica sin visual, o visual sin térmica
// todavía — esta última solo existe si el usuario la crea arrastrando/
// subiendo una foto en la zona dedicada, siempre primera en la grilla).
const cards = ref(
  manifest.pairs.map((p) => ({
    cardId: p.pair_id,
    thermalImage: imageById(p.thermal_image_id),
    visualImage: p.visual_image_id ? imageById(p.visual_image_id) : null,
    ambiguous: p.ambiguous,
  })),
)
const orphanVisuals = ref(manifest.orphan_visuals.map((v) => imageById(v.image_id) || v))
const keepDecision = ref({}) // image_id -> boolean (true = conservar como Extra), solo para huérfanas auto-detectadas

const error = ref('')
const warning = ref('')

// ── Paginación ──────────────────────────────────────────────────────────────
// Pares: 4 tarjetas de ancho x 2 de largo = 8 tarjetas visibles por página
// EN TOTAL, contando la tarjeta fija "Soltá una foto..." (que no pagina, ver
// template) — quedan 7 tarjetas de imágenes reales por página. Huérfanas: la
// sidebar es angosta (2 imágenes de ancho), 2 por página = 1 sola fila.
const PARES_PAGE_SIZE = 7
const ORPHAN_PAGE_SIZE = 4 // 2 de ancho x 2 de largo
const paresPage = ref(1)
const orphanPage = ref(1)

const paresTotalPages = computed(() => Math.max(1, Math.ceil(cards.value.length / PARES_PAGE_SIZE)))
const pagedCards = computed(() => {
  const start = (paresPage.value - 1) * PARES_PAGE_SIZE
  return cards.value.slice(start, start + PARES_PAGE_SIZE)
})
const orphanTotalPages = computed(() => Math.max(1, Math.ceil(orphanVisuals.value.length / ORPHAN_PAGE_SIZE)))
const pagedOrphans = computed(() => {
  const start = (orphanPage.value - 1) * ORPHAN_PAGE_SIZE
  return orphanVisuals.value.slice(start, start + ORPHAN_PAGE_SIZE)
})
watch(paresTotalPages, (total) => { if (paresPage.value > total) paresPage.value = total })
watch(orphanTotalPages, (total) => { if (orphanPage.value > total) orphanPage.value = total })

const lightboxImage = ref(null)
const lightboxUrl = ref(null)
async function verCompleta(image) {
  lightboxImage.value = image
  lightboxUrl.value = null
  lightboxUrl.value = await fetchBlobObjectUrl(`/electrico/batch/${batchId}/images/${image.image_id}/original`)
}
function cerrarLightbox() {
  lightboxImage.value = null
}

// ── Drag & drop nativo (HTML5) — reemplaza vuedraggable acá: necesitamos
// "mover entre N slots fijos, con reemplazo/desplazamiento", algo que
// vuedraggable maneja mal entre listas múltiples sincronizadas. ───────────
const draggingImageId = ref(null)

function onDragStart(image) {
  draggingImageId.value = image.image_id
}
function onDragEnd() {
  draggingImageId.value = null
}

function findImageWherever(imageId) {
  for (const card of cards.value) {
    if (card.visualImage?.image_id === imageId) return card.visualImage
  }
  return orphanVisuals.value.find((v) => v.image_id === imageId) || null
}

function removeImageFromEverywhere(imageId) {
  for (const card of cards.value) {
    if (card.visualImage?.image_id === imageId) card.visualImage = null
  }
  orphanVisuals.value = orphanVisuals.value.filter((v) => v.image_id !== imageId)
}

function onDropOnCard(card) {
  const imageId = draggingImageId.value
  if (!imageId) return
  const img = findImageWherever(imageId)
  if (!img || img.image_id === card.visualImage?.image_id) return
  removeImageFromEverywhere(imageId)
  if (card.visualImage) orphanVisuals.value.push(card.visualImage) // desplaza la anterior a huérfanas
  card.visualImage = img
  draggingImageId.value = null
}

function onDropOnOrphanZone() {
  const imageId = draggingImageId.value
  if (!imageId) return
  const img = findImageWherever(imageId)
  if (!img) return
  removeImageFromEverywhere(imageId)
  orphanVisuals.value.push(img)
  draggingImageId.value = null
}

function crearTarjetaSoloVisual(img) {
  cards.value.unshift({ cardId: `new_${img.image_id}`, thermalImage: null, visualImage: img, ambiguous: false })
  paresPage.value = 1 // la tarjeta nueva siempre va primera -> mostrar la página 1
}
function crearTarjetaSoloTermica(img) {
  cards.value.unshift({ cardId: `new_${img.image_id}`, thermalImage: img, visualImage: null, ambiguous: false })
  paresPage.value = 1
}

function onDropOnEmptyArea() {
  const imageId = draggingImageId.value
  if (!imageId) return
  const img = findImageWherever(imageId)
  if (!img) return
  removeImageFromEverywhere(imageId)
  crearTarjetaSoloVisual(img)
  draggingImageId.value = null
}

// ── Eliminar fotos / tarjetas (punto 3) ────────────────────────────────────
function eliminarTermica(card) {
  if (card.visualImage) orphanVisuals.value.push(card.visualImage)
  cards.value = cards.value.filter((c) => c.cardId !== card.cardId)
}
function eliminarVisualDeCard(card) {
  // Una tarjeta "solo-visual" (sin térmica) no tiene razón de seguir
  // existiendo si se le saca también la visual — se elimina directamente.
  if (!card.thermalImage) {
    cards.value = cards.value.filter((c) => c.cardId !== card.cardId)
    return
  }
  card.visualImage = null
}
function eliminarTarjetaCompleta(card) {
  cards.value = cards.value.filter((c) => c.cardId !== card.cardId)
}
function eliminarOrphan(image) {
  orphanVisuals.value = orphanVisuals.value.filter((v) => v.image_id !== image.image_id)
}

// ── Subir fotos nuevas durante la revisión (puntos 4, 5, 6) ───────────────
async function uploadToBatch(file) {
  const form = new FormData()
  form.append('files', file)
  const { data } = await apiClient.post(`/electrico/batch/${batchId}/images`, form)
  const img = data.images[0]
  manifest.images.push(img)
  await loadThumb(img)
  return img
}

async function checkPair(thermalImageId, visualImageId) {
  const { data } = await apiClient.post(`/electrico/batch/${batchId}/check-pair`, {
    thermal_image_id: thermalImageId, visual_image_id: visualImageId,
  })
  return data
}

async function subirVisualParaCard(card, e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  error.value = ''
  warning.value = ''
  const img = await uploadToBatch(file)
  if (!img.is_visual) {
    error.value = `"${file.name}" no parece ser una foto visual (RGB).`
    return
  }
  const check = await checkPair(card.thermalImage.image_id, img.image_id)
  if (check.matches) {
    card.visualImage = img
  } else {
    orphanVisuals.value.push(img)
    warning.value = `"${file.name}" no coincide con ${card.thermalImage.filename} (${check.reason}). Se agregó a "Fotos sin térmica asociada" — si igual es la correcta, arrastrala manualmente a esta tarjeta.`
  }
}

async function subirTermicaParaCard(card, e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  error.value = ''
  warning.value = ''
  const img = await uploadToBatch(file)
  if (!img.is_thermal) {
    error.value = `"${file.name}" no parece ser una foto térmica.`
    return
  }
  const check = await checkPair(img.image_id, card.visualImage.image_id)
  if (check.matches) {
    card.thermalImage = img
  } else {
    crearTarjetaSoloTermica(img)
    warning.value = `"${file.name}" no coincide con la visual de esta tarjeta (${check.reason}). Se creó como una tarjeta nueva.`
  }
}

// Único punto de entrada para crear tarjetas nuevas: la tarjeta "Soltá una
// foto..." acepta tanto una térmica como una visual y crea el tipo de
// tarjeta correspondiente (siempre al principio de la lista).
async function subirNuevaDesdeZonaVacia(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  error.value = ''
  const img = await uploadToBatch(file)
  if (img.is_thermal) {
    crearTarjetaSoloTermica(img)
  } else if (img.is_visual) {
    crearTarjetaSoloVisual(img)
  } else {
    error.value = `"${file.name}" no parece ser una foto térmica ni visual reconocible.`
  }
}

function confirmar() {
  const pairs = cards.value
    .filter((c) => c.thermalImage)
    .map((c) => ({
      pair_id: c.cardId,
      thermal_image_id: c.thermalImage.image_id,
      visual_image_id: c.visualImage?.image_id || null,
    }))

  // Tarjetas creadas a propósito sin térmica (punto 5) se funden con las
  // huérfanas, siempre conservadas (no hace falta tildar nada: el usuario ya
  // demostró su intención al crear la tarjeta).
  const thermalLessVisuals = cards.value.filter((c) => !c.thermalImage && c.visualImage).map((c) => c.visualImage)
  const allOrphans = [...orphanVisuals.value, ...thermalLessVisuals]

  wizard.state.manifest.pairs = pairs.map((p) => {
    const original = manifest.pairs.find((mp) => mp.pair_id === p.pair_id)
    return original ? { ...original, ...p } : { ...p, confidence: 1, confidence_reason: '', ambiguous: false }
  })
  wizard.state.manifest.orphan_visuals = allOrphans.map((v) => ({ image_id: v.image_id, filename: v.filename }))

  const thermalLessIds = new Set(thermalLessVisuals.map((v) => v.image_id))
  const keptIds = allOrphans
    .filter((v) => thermalLessIds.has(v.image_id) || keepDecision.value[v.image_id])
    .map((v) => v.image_id)
  wizard.confirmarPairing(keptIds)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col lg:flex-row gap-4 items-start">
      <!-- Pares detectados -->
      <div class="qnt-card space-y-3 flex-1 w-full">
        <h3 class="font-semibold text-[#113e4c]">Pares detectados ({{ cards.length }})</h3>
        <p class="text-sm text-[#536c6b]">
          Arrastrá una foto visual entre tarjetas o hacia "Fotos sin térmica asociada" para corregir un emparejado.
          Hacé click en una foto para verla en tamaño completo.
        </p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Zona para crear una tarjeta nueva (drag o subida directa, térmica o visual) — siempre primera -->
          <label
            class="border-2 border-dashed border-[#e0e5e5] rounded-md p-3 flex flex-col items-center justify-center gap-2 text-center text-xs text-[#536c6b] min-h-[16rem] cursor-pointer hover:border-[#113e4c] hover:bg-[#113e4c]/5"
            @dragover.prevent
            @drop.prevent="onDropOnEmptyArea"
          >
            <UploadCloud :size="22" />
            Soltá una foto visual acá, o hacé click para subir una térmica o visual y crear una tarjeta nueva
            <input type="file" accept="image/*" class="hidden" @change="subirNuevaDesdeZonaVacia" />
          </label>

          <div
            v-for="card in pagedCards" :key="card.cardId"
            class="border rounded-md p-3 space-y-2"
            :class="card.ambiguous ? 'border-yellow-400 bg-yellow-50' : (!card.thermalImage ? 'border-orange-300 bg-orange-50' : 'border-[#e0e5e5]')"
          >
            <div v-if="!card.thermalImage" class="flex items-start gap-1 text-xs text-orange-700">
              <AlertTriangle :size="14" class="flex-shrink-0 mt-0.5" />
              <span>Sin térmica asociada. Si no se le agrega una, esta foto va a quedar en "Fotos visuales sin térmica asociada".</span>
            </div>
            <div v-else-if="card.ambiguous" class="flex items-center gap-1 text-xs text-yellow-700">
              <AlertTriangle :size="14" /> Match ambiguo — revisar
            </div>

            <!-- Térmica -->
            <div class="flex items-center gap-1 text-xs font-medium text-[#113e4c]">
              <ImageIcon :size="13" /> Térmica
            </div>
            <div v-if="card.thermalImage" class="relative w-full bg-[#f3f5f5] rounded overflow-hidden cursor-pointer">
              <img
                v-if="thumbUrls[card.thermalImage.image_id]" :src="thumbUrls[card.thermalImage.image_id]"
                class="w-full h-auto block" @click="verCompleta(card.thermalImage)"
              />
              <button type="button" class="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-[#536c6b] hover:text-red-600" @click.stop="eliminarTermica(card)" title="Quitar térmica">
                <X :size="14" />
              </button>
            </div>
            <label v-else class="w-full aspect-[4/3] border-2 border-dashed border-orange-300 rounded flex flex-col items-center justify-center gap-1 text-xs text-orange-700 cursor-pointer hover:bg-orange-100">
              <UploadCloud :size="18" />
              Subir térmica para esta tarjeta
              <input type="file" accept="image/*" class="hidden" @change="subirTermicaParaCard(card, $event)" />
            </label>

            <!-- Visual -->
            <div class="flex items-center gap-1 text-xs font-medium text-[#113e4c]">
              <ImageIcon :size="13" /> Visual
            </div>
            <div
              class="w-full border border-dashed border-[#e0e5e5] rounded bg-[#f3f5f5] overflow-hidden"
              @dragover.prevent
              @drop.prevent="onDropOnCard(card)"
            >
              <div v-if="card.visualImage" class="relative w-full cursor-pointer">
                <img
                  v-if="thumbUrls[card.visualImage.image_id]" :src="thumbUrls[card.visualImage.image_id]"
                  class="w-full h-auto block cursor-move"
                  draggable="true" @dragstart="onDragStart(card.visualImage)" @dragend="onDragEnd"
                  @click="verCompleta(card.visualImage)"
                />
                <button type="button" class="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-[#536c6b] hover:text-red-600" @click.stop="eliminarVisualDeCard(card)" title="Quitar visual">
                  <X :size="14" />
                </button>
              </div>
              <label v-else class="w-full aspect-[4/3] flex flex-col items-center justify-center gap-1 text-xs text-[#536c6b] cursor-pointer hover:bg-[#113e4c]/5">
                <UploadCloud :size="18" />
                Arrastrá una visual o subí una nueva
                <input type="file" accept="image/*" class="hidden" @change="subirVisualParaCard(card, $event)" />
              </label>
            </div>

            <button
              type="button"
              class="text-xs text-red-600 flex items-center gap-1 rounded px-2 py-1 -mx-2 transition-colors hover:bg-red-50"
              @click="eliminarTarjetaCompleta(card)"
            >
              <Trash2 :size="13" /> Eliminar tarjeta completa
            </button>
          </div>
        </div>

        <div v-if="paresTotalPages > 1" class="flex items-center justify-center gap-3 pt-1">
          <button type="button" class="qnt-btn--secondary text-xs p-2" :disabled="paresPage === 1" @click="paresPage--">
            <ChevronLeft :size="14" />
          </button>
          <span class="text-xs text-[#536c6b]">Página {{ paresPage }} de {{ paresTotalPages }}</span>
          <button type="button" class="qnt-btn--secondary text-xs p-2" :disabled="paresPage === paresTotalPages" @click="paresPage++">
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>

      <!-- Fotos visuales sin térmica asociada -->
      <div class="qnt-card space-y-3 w-full lg:w-96 flex-shrink-0">
        <h3 class="font-semibold text-[#113e4c]">Fotos visuales sin térmica asociada ({{ orphanVisuals.length }})</h3>
        <p class="text-sm text-[#536c6b]">
          No aportan temperatura. Decidí si las descartás o las conservás como sección "Extra".
        </p>
        <div
          class="grid grid-cols-2 gap-3 min-h-[8rem] border border-dashed border-[#e0e5e5] rounded p-2 content-start"
          @dragover.prevent
          @drop.prevent="onDropOnOrphanZone"
        >
          <p v-if="orphanVisuals.length === 0" class="text-xs text-[#536c6b] col-span-2 text-center self-center">Sin fotos sueltas.</p>
          <div v-for="image in pagedOrphans" :key="image.image_id" class="space-y-1">
            <div class="relative w-full bg-white rounded overflow-hidden cursor-pointer">
              <img
                v-if="thumbUrls[image.image_id]" :src="thumbUrls[image.image_id]"
                class="w-full h-auto block cursor-move"
                draggable="true" @dragstart="onDragStart(image)" @dragend="onDragEnd"
                @click="verCompleta(image)"
              />
              <button type="button" class="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-[#536c6b] hover:text-red-600" @click.stop="eliminarOrphan(image)" title="Eliminar">
                <X :size="14" />
              </button>
            </div>
            <p class="text-xs truncate">{{ image.filename }}</p>
            <label class="flex items-center gap-1 text-xs">
              <input type="checkbox" v-model="keepDecision[image.image_id]" />
              Conservar como Extra
            </label>
          </div>
        </div>
        <div v-if="orphanTotalPages > 1" class="flex items-center justify-center gap-3">
          <button type="button" class="qnt-btn--secondary text-xs p-2" :disabled="orphanPage === 1" @click="orphanPage--">
            <ChevronLeft :size="14" />
          </button>
          <span class="text-xs text-[#536c6b]">Página {{ orphanPage }} de {{ orphanTotalPages }}</span>
          <button type="button" class="qnt-btn--secondary text-xs p-2" :disabled="orphanPage === orphanTotalPages" @click="orphanPage++">
            <ChevronRight :size="14" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="manifest.rejected.length" class="qnt-card">
      <h3 class="font-semibold text-[#113e4c] mb-2">Rechazadas ({{ manifest.rejected.length }})</h3>
      <ul class="text-sm text-[#536c6b] space-y-1">
        <li v-for="r in manifest.rejected" :key="r.image_id">{{ r.filename }} — {{ r.reason }}</li>
      </ul>
    </div>

    <p v-if="warning" class="text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded p-2">{{ warning }}</p>
    <p v-if="error" class="text-sm text-red-600">{{ error }}</p>
    <button class="qnt-btn--primary" @click="confirmar">Confirmar y continuar</button>

    <div v-if="lightboxImage" class="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4" @click="cerrarLightbox">
      <button type="button" class="absolute top-6 right-6 text-white" @click="cerrarLightbox"><X :size="28" /></button>
      <img v-if="lightboxUrl" :src="lightboxUrl" class="max-w-full max-h-full object-contain" @click.stop />
      <p v-else class="text-white">Cargando...</p>
    </div>
  </div>
</template>

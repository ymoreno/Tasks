import { Space, SpaceType } from '@/types'

// Definición de todos los espacios disponibles
export const SPACES: Space[] = [
  // Espacios interiores
  { id: 'baño_principal', name: 'Baño Principal', category: 'interior' },
  { id: 'vestier', name: 'Vestier', category: 'interior' },
  { id: 'cuarto_principal', name: 'Cuarto Principal', category: 'interior' },
  { id: 'oficina', name: 'Oficina', category: 'interior' },
  { id: 'sala_tv', name: 'Sala TV', category: 'interior' },
  { id: 'sala_juegos', name: 'Sala de Juegos', category: 'interior' },
  { id: 'biblioteca', name: 'Biblioteca', category: 'interior' },
  { id: 'sala', name: 'Sala', category: 'interior' },
  { id: 'cocina', name: 'Cocina', category: 'interior' },
  { id: 'cuarto_invitados', name: 'Cuarto de Invitados', category: 'interior' },
  { id: 'baño_invitados', name: 'Baño de Invitados', category: 'interior' },
  { id: 'gimnasio', name: 'Gimnasio', category: 'interior' },
  { id: 'alacena_alterna', name: 'Alacena Alterna', category: 'interior' },
  { id: 'cuarto_limpios', name: 'Cuarto de Limpios', category: 'interior' },
  
  // Espacios exteriores
  { id: 'balcon', name: 'Balcón', category: 'exterior' },
  { id: 'escaleras_anden', name: 'Escaleras y Andén', category: 'exterior' },
  { id: 'frente_porton_arco', name: 'Frente, Portón y Arco', category: 'exterior' },
  { id: 'patio_delantero', name: 'Patio Delantero', category: 'exterior' },
  { id: 'patio_trasero', name: 'Patio Trasero', category: 'exterior' },
  { id: 'vermi', name: 'Vermi', category: 'exterior' },
  { id: 'compost', name: 'Compost', category: 'exterior' },
  { id: 'rancho', name: 'Rancho', category: 'exterior' },
  { id: 'invernadero', name: 'Invernadero', category: 'exterior' },
  { id: 'bbq', name: 'BBQ', category: 'exterior' },
  { id: 'baño_externo', name: 'Baño Externo', category: 'exterior' },
  { id: 'terraza', name: 'Terraza', category: 'exterior' },
  
  // Espacios especiales
  { id: 'bodega_bajo_escaleras', name: 'Bodega Bajo Escaleras', category: 'especial' },
  { id: 'sala_control', name: 'Sala de Control', category: 'especial' },
  { id: 'camioneta', name: 'Camioneta', category: 'especial' },
  { id: 'frutero', name: 'Frutero', category: 'especial' }
]

export const spaceService = {
  // Obtener todos los espacios
  getAllSpaces(): Space[] {
    return SPACES
  },

  // Obtener espacios por categoría
  getSpacesByCategory(category: 'interior' | 'exterior' | 'especial'): Space[] {
    return SPACES.filter(space => space.category === category)
  },

  // Obtener espacio por ID
  getSpaceById(id: SpaceType): Space | undefined {
    return SPACES.find(space => space.id === id)
  },

  // Obtener nombre del espacio
  getSpaceName(id: SpaceType): string {
    const space = this.getSpaceById(id)
    return space ? space.name : id
  },

  // Agrupar espacios por categoría
  getSpacesGrouped(): { [category: string]: Space[] } {
    return {
      interior: this.getSpacesByCategory('interior'),
      exterior: this.getSpacesByCategory('exterior'),
      especial: this.getSpacesByCategory('especial')
    }
  },

  // Buscar espacios por nombre
  searchSpaces(query: string): Space[] {
    const lowerQuery = query.toLowerCase()
    return SPACES.filter(space => 
      space.name.toLowerCase().includes(lowerQuery) ||
      space.id.toLowerCase().includes(lowerQuery)
    )
  }
}

export default spaceService
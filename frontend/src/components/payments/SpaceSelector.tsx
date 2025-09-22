import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material'
import { ExpandMore, Home, Yard, Build } from '@mui/icons-material'
import { SpaceType } from '@/types'
import { spaceService } from '@/services/spaceService'

interface SpaceSelectorProps {
  value?: SpaceType
  onChange: (space: SpaceType | undefined) => void
  label?: string
  required?: boolean
  disabled?: boolean
  showGrouped?: boolean
}

const SpaceSelector: React.FC<SpaceSelectorProps> = ({
  value,
  onChange,
  label = 'Espacio',
  required = false,
  disabled = false,
  showGrouped = true
}) => {
  const spaces = spaceService.getAllSpaces()
  const groupedSpaces = spaceService.getSpacesGrouped()

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'interior': return <Home fontSize="small" />
      case 'exterior': return <Yard fontSize="small" />
      case 'especial': return <Build fontSize="small" />
      default: return undefined
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'interior': return 'primary'
      case 'exterior': return 'success'
      case 'especial': return 'warning'
      default: return 'default'
    }
  }

  if (showGrouped) {
    return (
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          {label} {required && '*'}
        </Typography>
        
        {/* Mostrar espacio seleccionado */}
        {value && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={spaceService.getSpaceName(value)}
              color={getCategoryColor(spaceService.getSpaceById(value)?.category || 'default') as any}
              icon={getCategoryIcon(spaceService.getSpaceById(value)?.category || '')}
              onDelete={() => onChange(undefined)}
              variant="filled"
            />
          </Box>
        )}

        {/* Selector agrupado por categorías */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {Object.entries(groupedSpaces).map(([category, categorySpaces]) => (
            <Accordion key={category} disabled={disabled}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getCategoryIcon(category)}
                  <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                    {category === 'interior' ? 'Espacios Interiores' :
                     category === 'exterior' ? 'Espacios Exteriores' :
                     'Espacios Especiales'}
                  </Typography>
                  <Chip 
                    label={categorySpaces.length} 
                    size="small" 
                    color={getCategoryColor(category) as any}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {categorySpaces.map((space) => (
                    <Chip
                      key={space.id}
                      label={space.name}
                      onClick={() => onChange(space.id)}
                      color={value === space.id ? getCategoryColor(category) as any : 'default'}
                      variant={value === space.id ? 'filled' : 'outlined'}
                      clickable
                      sx={{ cursor: 'pointer' }}
                    />
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Box>
    )
  }

  // Selector simple (dropdown tradicional)
  return (
    <FormControl fullWidth required={required} disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value as SpaceType || undefined)}
        label={label}
      >
        <MenuItem value="">
          <em>Sin espacio</em>
        </MenuItem>
        {spaces.map((space) => (
          <MenuItem key={space.id} value={space.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getCategoryIcon(space.category)}
              <Typography>{space.name}</Typography>
              <Chip 
                label={space.category} 
                size="small" 
                color={getCategoryColor(space.category) as any}
                variant="outlined"
              />
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default SpaceSelector
import React, { useState } from 'react';
import {
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Rating,
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import RecommendationCard from './RecommendationCard';
import type { RecommendationItem } from '../types/recommendations';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../types/recommendations';

interface RecommendationGridProps {
  items: RecommendationItem[];
  loading?: boolean;
}

const RecommendationGrid: React.FC<RecommendationGridProps> = ({
  items,
  loading = false,
}) => {
  const [selectedItem, setSelectedItem] = useState<RecommendationItem | null>(null);

  // Ensure items is always an array
  const safeItems = Array.isArray(items) ? items : [];

  const handleInfoClick = (item: RecommendationItem) => {
    setSelectedItem(item);
  };

  const handleCloseDialog = () => {
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Box
              sx={{
                height: 300,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {safeItems.map((item) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={item.id}>
            <RecommendationCard
              item={item}
              onInfoClick={handleInfoClick}
            />
          </Grid>
        ))}
      </Grid>

      {/* Cultural Insight Dialog */}
      <Dialog
        open={!!selectedItem}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: '1.5rem',
            background: 'var(--card-background)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 107, 53, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          }
        }}
      >
        {selectedItem && (
          <>
            <DialogTitle sx={{ pb: 1, pt: 3, px: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Chip
                  icon={React.createElement(CATEGORY_ICONS[selectedItem.category], { 
                    size: 16,
                    strokeWidth: 2 
                  })}
                  label={CATEGORY_LABELS[selectedItem.category]}
                  size="small"
                  sx={{ 
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                    color: 'white',
                    fontWeight: 600,
                    border: 'none',
                    '& .MuiChip-icon': {
                      color: 'white',
                    }
                  }}
                />
                {selectedItem.rating && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
                    <Rating
                      value={selectedItem.rating}
                      precision={0.1}
                      size="small"
                      readOnly
                      sx={{
                        '& .MuiRating-iconFilled': {
                          color: 'var(--accent-color)',
                        }
                      }}
                    />
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'var(--accent-color)',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      {selectedItem.rating.toFixed(1)}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography 
                variant="h5" 
                component="h2" 
                sx={{ 
                  fontWeight: 700,
                  color: 'var(--text-color)',
                  fontSize: '1.5rem'
                }}
              >
                {selectedItem.name}
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 3, pb: 2 }}>
              {/* Location */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5, 
                  mb: 2,
                  cursor: 'pointer',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  backgroundColor: 'rgba(255, 107, 53, 0.05)',
                  border: '1px solid rgba(255, 107, 53, 0.2)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    borderColor: 'var(--primary-color)',
                    transform: 'translateY(-2px)',
                  }
                }}
                onClick={() => {
                  const encodedLocation = encodeURIComponent(`${selectedItem.location}, Varanasi, India`);
                  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
                  window.open(googleMapsUrl, '_blank');
                }}
              >
                <LocationIcon 
                  fontSize="small" 
                  sx={{ color: 'var(--primary-color)' }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'var(--text-light)',
                    fontWeight: 500,
                    '&:hover': {
                      color: 'var(--primary-color)',
                    }
                  }}
                >
                  📍 {selectedItem.location}
                </Typography>
              </Box>

              {/* Price and Hours */}
              {(selectedItem.price_range || selectedItem.opening_hours) && (
                <Box sx={{ mb: 2 }}>
                  {selectedItem.price_range && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'var(--primary-color)',
                        fontWeight: 600,
                        mb: 0.5,
                        fontSize: '0.9rem'
                      }}
                    >
                      💰 {selectedItem.price_range}
                    </Typography>
                  )}
                  {selectedItem.opening_hours && (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'var(--text-light)',
                        fontWeight: 500,
                        fontSize: '0.9rem'
                      }}
                    >
                      🕒 {selectedItem.opening_hours}
                    </Typography>
                  )}
                </Box>
              )}

              {/* Description */}
              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  color: 'var(--text-light)',
                  lineHeight: 1.6,
                  fontSize: '1rem'
                }}
              >
                {selectedItem.description}
              </Typography>

              {/* Cultural Insight */}
              <Box sx={{ 
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%)',
                p: 2.5, 
                borderRadius: '1rem', 
                border: '2px solid var(--accent-color)',
                mb: 2,
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(245, 158, 11, 0.05) 20px, rgba(245, 158, 11, 0.05) 40px)',
                  borderRadius: '1rem',
                  pointerEvents: 'none',
                }
              }}>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: 'var(--accent-color)',
                    fontWeight: 700,
                    mb: 1,
                    fontSize: '1rem',
                    position: 'relative',
                    zIndex: 1,
                  }}
                  gutterBottom
                >
                  🌟 Cultural Insight
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontStyle: 'italic',
                    color: 'var(--text-color)',
                    lineHeight: 1.5,
                    fontSize: '0.95rem',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {selectedItem.cultural_insight}
                </Typography>
              </Box>

              {/* Tags */}
              {selectedItem.tags && selectedItem.tags.length > 0 && (
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ 
                      color: 'var(--text-color)',
                      fontWeight: 600,
                      mb: 1
                    }}
                  >
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {selectedItem.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        sx={{
                          borderColor: 'rgba(255, 107, 53, 0.3)',
                          color: 'var(--primary-color)',
                          backgroundColor: 'rgba(255, 107, 53, 0.05)',
                          fontWeight: 500,
                          '&:hover': {
                            borderColor: 'var(--primary-color)',
                            backgroundColor: 'rgba(255, 107, 53, 0.1)',
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button 
                onClick={handleCloseDialog} 
                sx={{
                  background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                  color: 'white',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderRadius: '0.75rem',
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': {
                    background: 'linear-gradient(135deg, var(--secondary-color) 0%, var(--primary-color) 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default RecommendationGrid;
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Rating,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import type { RecommendationItem } from '../types/recommendations';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '../types/recommendations';

interface RecommendationCardProps {
  item: RecommendationItem;
  onInfoClick?: (item: RecommendationItem) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  item,
  onInfoClick,
}) => {
  const handleInfoClick = () => {
    if (onInfoClick) {
      onInfoClick(item);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--card-background)',
        border: '2px solid rgba(255, 107, 53, 0.1)',
        borderRadius: '1.5rem',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          borderColor: 'var(--primary-color)',
        },
      }}
    >
      {/* Category Icon Header */}
      <Box
        sx={{
          height: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
          borderRadius: '1.5rem 1.5rem 0 0',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
            opacity: 0.3,
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            animation: 'aarti-wave 4s ease-in-out infinite',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
            color: 'white',
          }}
        >
          {React.createElement(CATEGORY_ICONS[item.category], { 
            size: 64,
            strokeWidth: 1.5 
          })}
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
        {/* Header with category and rating */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Chip
            icon={React.createElement(CATEGORY_ICONS[item.category], { 
              size: 16,
              strokeWidth: 2 
            })}
            label={CATEGORY_LABELS[item.category]}
            size="small"
            sx={{ 
              fontSize: '0.75rem',
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
              color: 'white',
              fontWeight: 600,
              border: 'none',
              '& .MuiChip-label': {
                padding: '0.5rem 0.75rem',
              },
              '& .MuiChip-icon': {
                color: 'white',
                marginLeft: '0.5rem',
              }
            }}
          />
          {item.rating && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating
                value={item.rating}
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
                  fontSize: '0.8rem'
                }}
              >
                {item.rating.toFixed(1)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Title */}
        <Typography 
          variant="h6" 
          component="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            color: 'var(--text-color)',
            fontSize: '1.25rem',
            lineHeight: 1.3,
            mb: 1
          }}
        >
          {item.name}
        </Typography>

        {/* Description */}
        <Typography 
          variant="body2" 
          sx={{ 
            mb: 1.5,
            flexGrow: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            color: 'var(--text-light)',
            lineHeight: 1.5,
            fontSize: '0.9rem'
          }}
        >
          {item.description}
        </Typography>

        {/* Location */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5, 
            mb: 1.5,
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(255, 107, 53, 0.1)',
              transform: 'translateX(4px)',
            }
          }}
          onClick={() => {
            const encodedLocation = encodeURIComponent(`${item.location}, Varanasi, India`);
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
              fontSize: '0.85rem',
              fontWeight: 500,
              '&:hover': {
                color: 'var(--primary-color)',
                textDecoration: 'underline',
              }
            }}
          >
            {item.location}
          </Typography>
        </Box>

        {/* Cultural Insight */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 1.5 }}>
          <Tooltip title="Cultural Insight">
            <IconButton 
              size="small" 
              onClick={handleInfoClick}
              sx={{ 
                p: 0, 
                mt: 0.25,
                color: 'var(--accent-color)',
                '&:hover': {
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                }
              }}
            >
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Typography 
            variant="body2" 
            sx={{ 
              fontStyle: 'italic',
              cursor: onInfoClick ? 'pointer' : 'default',
              color: 'var(--accent-color)',
              fontWeight: 500,
              fontSize: '0.85rem',
              lineHeight: 1.4,
              '&:hover': onInfoClick ? { 
                textDecoration: 'underline',
                color: 'var(--primary-color)'
              } : {},
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            onClick={handleInfoClick}
          >
            {item.cultural_insight}
          </Typography>
        </Box>

        {/* Price and Hours */}
        {(item.price_range || item.opening_hours) && (
          <Box sx={{ mb: 1.5 }}>
            {item.price_range && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'var(--primary-color)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  mb: 0.5
                }}
              >
                💰 {item.price_range}
              </Typography>
            )}
            {item.opening_hours && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'var(--text-light)',
                  fontSize: '0.8rem',
                  fontWeight: 500
                }}
              >
                🕒 {item.opening_hours}
              </Typography>
            )}
          </Box>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 'auto' }}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.7rem',
                  height: 24,
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
            {item.tags.length > 3 && (
              <Chip
                label={`+${item.tags.length - 3}`}
                size="small"
                sx={{ 
                  fontSize: '0.7rem',
                  height: 24,
                  background: 'linear-gradient(135deg, var(--accent-color) 0%, var(--primary-color) 100%)',
                  color: 'white',
                  fontWeight: 600,
                  border: 'none'
                }}
              />
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;
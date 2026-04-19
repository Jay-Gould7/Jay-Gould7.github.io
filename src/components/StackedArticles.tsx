import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export interface Article {
  id: string;
  title: string;
  date: string;
  excerpt: string;
  href: string;
}

interface Props {
  articles: Article[];
}

export default function StackedArticles({ articles }: Props) {
  const [cards, setCards] = useState(articles);
  const [exitX, setExitX] = useState<number>(0);

  // When drag ends, determine if dragged far enough
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: any) => {
    // If dragged at least 100px left or right
    if (Math.abs(info.offset.x) > 100 || Math.abs(info.offset.y) > 100) {
      setExitX(info.offset.x > 0 ? 200 : -200); // Send it flying
      
      // Remove top card and send it to back
      setTimeout(() => {
        setCards((prev) => {
          const newArray = [...prev];
          const first = newArray.shift();
          if (first) newArray.push(first);
          return newArray;
        });
      }, 50);
    }
  };

  return (
    <div 
      className="stacked-articles-container" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '500px', /* Increased container height to accommodate taller cards */
        perspective: '1000px',
        pointerEvents: 'none' // the container allows clicks through the empty space
      }}
    >
      <AnimatePresence mode="popLayout">
        {cards.map((article, index) => {
          const isFront = index === 0;
          const isSecond = index === 1;
          const isThird = index === 2;
          
          // Limit to showing 3 cards max
          if (index > 2) return null;

          return (
            <motion.div
              key={article.id}
              layout
              initial={
                isFront ? { scale: 0.9, y: 30, opacity: 0 } : false
              }
              animate={{
                scale: isFront ? 1 : isSecond ? 0.95 : 0.9,
                y: isFront ? 0 : isSecond ? 25 : 50,
                rotateZ: isFront ? 0 : index % 2 === 0 ? 3 : -3, 
                zIndex: cards.length - index,
                opacity: isThird ? 0.6 : 1,
              }}
              exit={{
                x: exitX,
                opacity: 0,
                scale: 0.8,
                transition: { duration: 0.2 }
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 24,
                mass: 0.8
              }}
              drag={isFront ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={isFront ? handleDragEnd : undefined}
              whileDrag={{ scale: 1.05, rotate: exitX > 0 ? 5 : -5, cursor: "grabbing" }}
              whileHover={isFront ? { scale: 1.02, cursor: "grab" } : {}}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                pointerEvents: isFront ? 'auto' : 'none',
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  textDecoration: 'none',
                  background: isFront ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.04)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '1.5rem',
                  borderRadius: '16px',
                  color: '#fff',
                  boxShadow: isFront ? '0 12px 40px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.1)',
                  height: '380px', /* Taller card */
                  boxSizing: 'border-box'
                }}
              >
                  <div style={{
                    fontFamily: "'Space Grotesk', 'Inter', monospace",
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '0.8rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                      <span>{article.date}</span>
                      {isFront && (
                          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>SWIPE →</span>
                      )}
                  </div>
                  <h3 style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    margin: '0 0 0.8rem 0',
                    lineHeight: 1.3,
                    color: 'rgba(255,255,255,0.95)'
                  }}>{article.title}</h3>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.65)',
                    lineHeight: 1.5,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    flexGrow: 1
                  }}>{article.excerpt}</p>
                  
                  {isFront && (
                      <a href={article.href} style={{
                          marginTop: '0.8rem',
                          background: 'rgba(255,255,255,0.1)',
                          padding: '0.5rem 0.8rem',
                          borderRadius: '8px',
                          color: '#fff',
                          textDecoration: 'none',
                          fontSize: '0.8rem',
                          textAlign: 'center',
                          border: '1px solid rgba(255,255,255,0.2)'
                      }}>
                          Read Article
                      </a>
                  )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

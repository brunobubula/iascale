import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function FinancialMarketAnimation() {
  return (
    <div className="relative w-80 h-80 mx-auto">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 300">
        {/* Grid radial */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <motion.circle
            key={`grid-${i}`}
            cx="150"
            cy="150"
            r={30 + i * 20}
            fill="none"
            stroke="rgba(100, 116, 139, 0.2)"
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}

        {/* Linhas radiais */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
          const angle = (i * 30 - 90) * Math.PI / 180;
          const x = 150 + Math.cos(angle) * 130;
          const y = 150 + Math.sin(angle) * 130;
          return (
            <motion.line
              key={`line-${i}`}
              x1="150"
              y1="150"
              x2={x}
              y2={y}
              stroke="rgba(100, 116, 139, 0.15)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.5 + i * 0.05, duration: 0.8 }}
            />
          );
        })}

        {/* Candlesticks animados */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i * 45) * Math.PI / 180;
          const radius = 100;
          const x = 150 + Math.cos(angle) * radius;
          const y = 150 + Math.sin(angle) * radius;
          const isGreen = Math.random() > 0.5;
          
          return (
            <motion.g key={`candle-${i}`}>
              {/* Wick */}
              <motion.line
                x1={x}
                y1={y - 8}
                x2={x}
                y2={y + 8}
                stroke={isGreen ? "#10b981" : "#ef4444"}
                strokeWidth="1"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  scaleY: [0, 1, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.25
                }}
              />
              {/* Body */}
              <motion.rect
                x={x - 3}
                y={isGreen ? y - 5 : y - 3}
                width="6"
                height={isGreen ? 5 : 3}
                fill={isGreen ? "#10b981" : "#ef4444"}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 0],
                  scaleY: [0, 1, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.25
                }}
              />
            </motion.g>
          );
        })}

        {/* Linha de tendência */}
        <motion.path
          d="M 50,180 Q 100,150 150,160 T 250,140"
          fill="none"
          stroke="url(#trendGradient)"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: [0, 1, 1, 0],
            opacity: [0, 1, 1, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Rede neural */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((i) => {
          const angle = (i * 22.5) * Math.PI / 180;
          const radius = 80 + (i % 2) * 30;
          const x = 150 + Math.cos(angle) * radius;
          const y = 150 + Math.sin(angle) * radius;
          
          return (
            <motion.g key={`node-${i}`}>
              {i < 15 && (
                <motion.line
                  x1={x}
                  y1={y}
                  x2={150 + Math.cos((i + 1) * 22.5 * Math.PI / 180) * (80 + ((i + 1) % 2) * 30)}
                  y2={150 + Math.sin((i + 1) * 22.5 * Math.PI / 180) * (80 + ((i + 1) % 2) * 30)}
                  stroke="rgba(168, 85, 247, 0.3)"
                  strokeWidth="1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ 
                    pathLength: [0, 1],
                    opacity: [0, 0.6, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              )}
              <motion.circle
                cx={x}
                cy={y}
                r="3"
                fill="#a855f7"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.5, 1],
                  opacity: [0, 1, 0.6]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            </motion.g>
          );
        })}

        <defs>
          <linearGradient id="trendGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* Ícone central */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="relative">
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30"
            style={{ width: 80, height: 80, left: -16, top: -16 }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
          <Sparkles className="w-12 h-12 text-purple-400 relative z-10" />
        </div>
      </motion.div>

      {/* Dados flutuantes - Fonte 2x maior no desktop */}
      {[
        { value: "BTC", color: "#f59e0b" },
        { value: "ETH", color: "#8b5cf6" },
        { value: "RSI", color: "#10b981" },
        { value: "MACD", color: "#3b82f6" },
        { value: "1h", color: "#ec4899" },
        { value: "4h", color: "#06b6d4" },
      ].map((item, i) => {
        const angle = (i * 60) * Math.PI / 180;
        const startRadius = 140;
        const endRadius = 180;
        
        return (
          <motion.div
            key={`data-${i}`}
            className="absolute text-xs md:text-2xl font-bold"
            style={{
              left: '50%',
              top: '50%',
              color: item.color,
            }}
            initial={{
              x: Math.cos(angle) * startRadius - 15,
              y: Math.sin(angle) * startRadius - 10,
              opacity: 0
            }}
            animate={{
              x: Math.cos(angle) * endRadius - 15,
              y: Math.sin(angle) * endRadius - 10,
              opacity: [0, 1, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          >
            {item.value}
          </motion.div>
        );
      })}

      {/* Efeito Matrix - Fonte 2x maior no desktop */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((i) => (
        <motion.div
          key={`matrix-${i}`}
          className="absolute text-green-400 text-xs md:text-2xl font-mono opacity-20"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
          }}
          animate={{
            y: [0, 350],
            opacity: [0, 0.4, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "linear"
          }}
        >
          {Math.floor(Math.random() * 10)}
        </motion.div>
      ))}
    </div>
  );
}
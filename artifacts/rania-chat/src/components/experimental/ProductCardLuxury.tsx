import React from 'react';
import { motion } from 'framer-motion';
import './design-tokens.css';

type Props = {
  title: string;
  subtitle?: string;
  priceUSD: number;
  imageUrl: string;
  badge?: string;
  onApply?: () => void;
  onContact?: () => void;
};

export default function ProductCardLuxury({ title, subtitle, priceUSD, imageUrl, badge, onApply, onContact }: Props) {
  return (
    <motion.article
      className="luxury-card"
      role="article"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.42, ease: [0.2, 0.9, 0.2, 1] }}
    >
      {badge && <div className="luxury-badge" aria-hidden style={{ position: 'absolute', right: 14, top: 14, padding: '6px 10px', borderRadius: 10, background: 'linear-gradient(90deg, rgba(0,0,0,0.35), rgba(255,255,255,0.02))', fontWeight: 700, fontSize: 12 }}>{badge}</div>}

      <div className="luxury-media" style={{ backgroundImage: `url(${imageUrl})` }} />

      <div className="luxury-body">
        <h3 className="luxury-title">{title}</h3>
        {subtitle && <div className="luxury-sub muted" style={{ marginBottom: 8 }}>{subtitle}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <div className="luxury-price"><span className="symbol">$</span>{priceUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="glass-btn primary" onClick={onApply} aria-label={`Apply to partner for ${title}`}>Apply</button>
            <button className="glass-btn ghost" onClick={onContact} aria-label={`Contact seller for ${title}`}>Contact</button>
          </div>
        </div>
      </div>

      <div className="preview-pop" aria-hidden style={{ marginTop: 12 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>Quick details</div>
        <div style={{ fontSize: 13 }}>Authenticity: Certificate included</div>
        <div style={{ fontSize: 13 }}>Ships from: Timor-Leste</div>
      </div>
    </motion.article>
  );
}

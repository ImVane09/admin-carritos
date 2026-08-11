import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';

export function DetailModal({ 
  header, 
  visible, 
  onHide, 
  icon, 
  title, 
  subtitle, 
  children 
}) {
  return (
    <Dialog
      header={header}
      visible={visible}
      style={{ width: "30rem" }}
      onHide={onHide}
      dismissableMask
    >
      <div className="user-detail-card" style={{ padding: "0.5rem 0" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--brand-700)",
              color: "white",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              fontWeight: "bold",
              margin: "0 auto 0.5rem auto",
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            }}
          >
            {typeof icon === 'string' && icon.startsWith('pi ') ? (
              <i className={icon} style={{ fontSize: '1.5rem' }} />
            ) : (
              icon
            )}
          </div>
          <h3
            style={{
              margin: "0.3rem 0",
              color: "var(--brand-900)",
              fontSize: "1.35rem",
              fontWeight: "600",
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                color: "var(--ink-500)",
                fontSize: "0.85rem",
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gap: "1rem",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            paddingTop: "1.2rem",
            paddingBottom: "1.2rem",
            marginBottom: "1.2rem"
          }}
        >
          {children}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            label="Cerrar" 
            icon="pi pi-times" 
            onClick={onHide} 
            className="p-button-text p-button-secondary" 
            style={{ color: 'var(--ink-600)', fontWeight: 'bold' }}
          />
        </div>
      </div>
    </Dialog>
  );
}

export function DetailField({ icon, label, children, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          color: "var(--ink-500)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {icon && (
          <i
            className={icon}
            style={{ color: "var(--brand-500)" }}
          />
        )}
        {label}:
      </span>
      <div
        style={{
          color: "var(--ink-900)",
          wordBreak: "break-word",
          marginLeft: "1rem",
          textAlign: "right",
          fontWeight: "700"
        }}
      >
        {children !== undefined ? children : value}
      </div>
    </div>
  );
}

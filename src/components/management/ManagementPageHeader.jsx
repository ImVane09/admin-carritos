import React from 'react';
import { Button } from 'primereact/button';

export default function ManagementPageHeader({ 
  title, 
  subtitle, 
  icon, 
  buttonLabel, 
  onButtonClick, 
  buttonIcon = "pi pi-plus" 
}) {
  return (
    <div className="management-header">
      <div className="management-header-left">
        {icon && <i className={icon} />}
        <div className="management-header-content">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      {buttonLabel && onButtonClick && (
        <Button 
          label={buttonLabel} 
          icon={buttonIcon} 
          onClick={onButtonClick} 
          className="p-button-primary" 
        />
      )}
    </div>
  );
}

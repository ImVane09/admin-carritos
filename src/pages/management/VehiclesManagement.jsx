import { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { fetchVehicles, createVehicle, updateVehicle, toggleVehicleStatus, deleteVehicle } from '../../services/adminService';

const EMPTY_FORM = {
  id: null,
  brand: '',
  model: '',
  plate: '',
  color: '',
  capacity: '',
};

export default function VehiclesManagement() {
  const toast = useRef(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchVehicles({ page, per_page: 10, search: debouncedQuery, is_active: statusFilter });
        const dataArray = result?.data || [];
        setVehicles(dataArray);
        setTotalRecords(result?.total || 0);
      } catch (err) {
        console.error('Error al cargar vehículos:', err);
        setVehicles([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, debouncedQuery, statusFilter]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setCreating(true);
    setEditing(false);
  };

  const openEdit = (vehicle) => {
    setForm({
      id: vehicle.id,
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      plate: vehicle.plate || '',
      color: vehicle.color || '',
      capacity: vehicle.capacity ? String(vehicle.capacity) : '',
    });
    setEditing(true);
    setCreating(false);
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(false);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.brand.trim() || !form.model.trim() || !form.plate.trim() || !form.color.trim() || !form.capacity) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Completa todos los campos obligatorios.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        plate: form.plate.trim().toUpperCase(),
        color: form.color.trim(),
        capacity: parseInt(form.capacity, 10)
      };

      if (editing) {
        const response = await updateVehicle(form.id, payload);
        const updatedVehicle = response.vehicle || response;
        setVehicles(vehicles.map((v) => (v.id === form.id ? updatedVehicle : v)));
        toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Vehículo actualizado correctamente' });
      } else {
        const response = await createVehicle(payload);
        const newVehicle = response.vehicle || response;
        setVehicles([newVehicle, ...vehicles]);
        toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Vehículo creado correctamente' });
      }
      closeForm();
    } catch (err) {
      console.error(err);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: err.response?.data?.message || err.response?.data?.error || 'Error al guardar vehículo.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (vehicle) => {
    setLoading(true);
    try {
      const response = await toggleVehicleStatus(vehicle.id);
      const is_active = response.is_active !== undefined ? response.is_active : !vehicle.is_active;
      
      setVehicles(vehicles.map((v) => v.id === vehicle.id ? { ...v, is_active } : v));
      toast.current?.show({ severity: 'success', summary: 'Estado actualizado', detail: 'Se cambió el estado del vehículo' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado.' });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setLoading(true);
    try {
      await deleteVehicle(deleteConfirm.id);
      setVehicles(vehicles.filter((v) => v.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Vehículo eliminado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: err.response?.data?.message || 'No se pudo eliminar el vehículo.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      <div className="management-section">
        <div className="management-header">
          <div className="management-header-left">
            <i className="pi pi-car" />
            <div className="management-header-content">
              <h2>Vehículos</h2>
              <p>Gestión del inventario de carritos de golf</p>
            </div>
          </div>
          <Button label="Nuevo Vehículo" icon="pi pi-plus" className="p-button-primary" onClick={openCreate} />
        </div>

        <Card className="management-table">
          <div className="management-toolbar">
            <h3>Lista de Vehículos ({totalRecords})</h3>
            <div className="management-toolbar-filters">
              <Dropdown 
                value={statusFilter} 
                options={[
                  { label: 'Todos', value: null },
                  { label: 'Activos', value: true },
                  { label: 'En mantenimiento', value: false }
                ]} 
                optionLabel="label"
                optionValue="value"
                onChange={(e) => { setStatusFilter(e.value); setPage(1); }} 
                placeholder="Filtrar por estado" 
              />
              <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="Buscar por placas o modelo" 
                />
              </span>
            </div>
          </div>

          <DataTable 
            value={vehicles} 
            lazy
            paginator 
            first={(page - 1) * 10}
            onPage={(e) => setPage(e.page + 1)}
            totalRecords={totalRecords}
            rows={10} 
            loading={loading} 
            responsiveLayout="scroll" 
            stripedRows 
            emptyMessage="No hay vehículos registrados"
          >
            <Column field="plate" header="Placas" sortable body={(row) => <span style={{ fontWeight: 'bold' }}>{row.plate}</span>} />
            <Column field="brand" header="Marca" sortable />
            <Column field="model" header="Modelo" sortable />
            <Column field="color" header="Color" />
            <Column field="capacity" header="Capacidad" sortable body={(row) => `${row.capacity} pax`} />
            <Column
              header="Estado"
              body={(row) => (
                <span className={`status-badge status-${row.is_active ? 'activo' : 'inactivo'}`}>
                  {row.is_active ? 'Activo' : 'Inactivo'}
                </span>
              )}
            />
            <Column
              header="Acciones"
              body={(row) => (
                <div className="action-buttons">
                  <Button size="small" icon="pi pi-eye" text onClick={() => setSelected(row)} title="Ver Detalles" />
                  <Button size="small" icon="pi pi-pencil" text className="p-button-warning" onClick={() => openEdit(row)} title="Editar" />
                  <Button 
                    size="small" 
                    icon={row.is_active ? "pi pi-eye-slash" : "pi pi-check-circle"} 
                    text 
                    className={row.is_active ? "p-button-secondary" : "p-button-success"} 
                    onClick={() => handleToggleStatus(row)} 
                    title={row.is_active ? "Desactivar" : "Activar"} 
                  />
                  <Button size="small" icon="pi pi-trash" text className="p-button-danger" onClick={() => setDeleteConfirm(row)} title="Eliminar" />
                </div>
              )}
            />
          </DataTable>
        </Card>

        <Dialog
          header="Detalles del Vehículo"
          visible={!!selected}
          style={{ width: '32rem' }}
          onHide={() => setSelected(null)}
        >
          {selected && (
            <div className="user-detail">
              <p><strong>Placas:</strong> {selected.plate}</p>
              <p><strong>Marca:</strong> {selected.brand}</p>
              <p><strong>Modelo:</strong> {selected.model}</p>
              <p><strong>Color:</strong> {selected.color}</p>
              <p><strong>Capacidad:</strong> {selected.capacity} pasajeros</p>
              <p><strong>Estado:</strong> {selected.is_active ? 'Activo' : 'Inactivo'}</p>
            </div>
          )}
        </Dialog>

        <Dialog
          header={creating ? 'Registrar Nuevo Vehículo' : 'Editar Vehículo'}
          visible={creating || editing}
          style={{ width: '40rem' }}
          onHide={closeForm}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="vehicle-plate" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Placas</label>
              <InputText
                id="vehicle-plate"
                value={form.plate}
                onChange={(event) => setForm({ ...form, plate: event.target.value.toUpperCase() })}
                className="w-full"
                placeholder="Ej: ABC-1234"
              />
            </div>

            <div>
              <label htmlFor="vehicle-brand" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Marca</label>
              <InputText
                id="vehicle-brand"
                value={form.brand}
                onChange={(event) => setForm({ ...form, brand: event.target.value })}
                className="w-full"
                placeholder="Ej: Toyota"
              />
            </div>

            <div>
              <label htmlFor="vehicle-model" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Modelo</label>
              <InputText
                id="vehicle-model"
                value={form.model}
                onChange={(event) => setForm({ ...form, model: event.target.value })}
                className="w-full"
                placeholder="Ej: Corolla"
              />
            </div>

            <div>
              <label htmlFor="vehicle-color" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Color</label>
              <InputText
                id="vehicle-color"
                value={form.color}
                onChange={(event) => setForm({ ...form, color: event.target.value })}
                className="w-full"
                placeholder="Ej: Blanco"
              />
            </div>

            <div>
              <label htmlFor="vehicle-capacity" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Capacidad (Pasajeros)</label>
              <InputText
                id="vehicle-capacity"
                type="number"
                min="1"
                max="10"
                value={form.capacity}
                onChange={(event) => setForm({ ...form, capacity: event.target.value })}
                className="w-full"
                placeholder="Ej: 4"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
            <Button label="Cancelar" onClick={closeForm} className="p-button-text" />
            <Button label={creating ? 'Registrar' : 'Guardar'} onClick={handleSave} className="p-button-primary" />
          </div>
        </Dialog>

        <Dialog
          header="Confirmar Eliminación"
          visible={!!deleteConfirm}
          style={{ width: '32rem' }}
          onHide={() => setDeleteConfirm(null)}
        >
          <p>¿Está seguro que desea eliminar este vehículo? Esta acción no se puede deshacer.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button label="Cancelar" onClick={() => setDeleteConfirm(null)} className="p-button-text" />
            <Button label="Eliminar" onClick={confirmDelete} className="p-button-danger" />
          </div>
        </Dialog>
      </div>
    </>
  );
}

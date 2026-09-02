import { useEffect, useRef, useState } from 'react';
import ManagementPageHeader from "../../components/management/ManagementPageHeader";
import { DetailModal, DetailField } from "../../components/ui/DetailModal";
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { InputSwitch } from 'primereact/inputswitch';
import StatCardPremium from '../../components/StatCardPremium';
import CustomDataTable from "../../components/ui/CustomDataTable";
import ManagementActionButtons from "../../components/management/ManagementActionButtons";
import { fetchVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../services/adminService';

const EMPTY_FORM = {
  id: null,
  brand: '',
  model: '',
  plate: '',
  color: '',
  capacity: 4,
  status: 'active'
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
  const [globalStats, setGlobalStats] = useState({ total: 0, inactive: 0, maintenance: 0 });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async (pageNumber = page) => {
    setLoading(true);
    try {
      const result = await fetchVehicles({ page: pageNumber, per_page: 10, search: debouncedQuery, status: statusFilter });
      const dataArray = result?.data || [];
      setVehicles(dataArray);
      setTotalRecords(result?.total || 0);
      if (result?.total_registrados !== undefined) {
        setGlobalStats({
          total: result.total_registrados,
          inactive: result.total_inactivos,
          maintenance: result.total_mantenimiento
        });
      }
    } catch (err) {
      console.error('Error al cargar vehículos:', err);
      setVehicles([]);
      setTotalRecords(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(page);
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
      plate: vehicle.plate,
      color: vehicle.color,
      capacity: vehicle.capacity,
      status: vehicle.status || 'active'
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

    setIsSubmitting(true);
    try {
      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        plate: form.plate.trim().toUpperCase(),
        color: form.color.trim(),
        capacity: parseInt(form.capacity, 10),
        status: form.status
      };

      if (editing) {
        await updateVehicle(form.id, payload);
        toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Vehículo actualizado correctamente' });
      } else {
        await createVehicle(payload);
        toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Vehículo creado correctamente' });
      }
      closeForm();
      await loadData();
    } catch (err) {
      console.error(err);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: err.response?.data?.message || err.response?.data?.error || 'Error al guardar vehículo.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    setIsSubmitting(true);
    try {
      await deleteVehicle(deleteConfirm.id);
      setDeleteConfirm(null);
      toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Vehículo eliminado correctamente' });
      await loadData();
    } catch (err) {
      console.error(err);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: err.response?.data?.message || 'No se pudo eliminar el vehículo.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      <div className="management-section">
        <ManagementPageHeader
          title="Vehículos"
          subtitle="Gestión del inventario de carritos de golf"
          icon="pi pi-car"
          buttonLabel="Nuevo Vehículo"
          onButtonClick={openCreate}
        />

        <div className="dashboard-grid-premium">
          <StatCardPremium
            title="Total Vehículos"
            value={globalStats.total}
            icon="pi pi-car"
            tone="blue"
            subtitle="Registrados en sistema"
            loading={loading}
          />
          <StatCardPremium
            title="Inactivos"
            value={globalStats.inactive}
            icon="pi pi-times-circle"
            tone="red"
            subtitle="Listados actualmente"
            loading={loading}
          />
          <StatCardPremium
            title="Mantenimiento"
            value={globalStats.maintenance}
            icon="pi pi-wrench"
            tone="amber"
            subtitle="Listados actualmente"
            loading={loading}
          />
        </div>

      <CustomDataTable
        value={vehicles}
        columns={[
          { field: "plate", header: "Placas", body: (row) => <span style={{ fontWeight: 'bold' }}>{row.plate}</span> },
          { field: "brand", header: "Marca" },
          { field: "model", header: "Modelo" },
          { field: "color", header: "Color" },
          { field: "capacity", header: "Capacidad", body: (row) => `${row.capacity} pax` },
          { header: "Estado", body: (row) => {
              if (row.deleted_at) return <span className="status-badge status-danger">Eliminado</span>;
              const statusLabels = {
                'active': { label: 'Activo', class: 'status-activo' },
                'inactive': { label: 'Inactivo', class: 'status-inactivo' },
                'maintenance': { label: 'Mantenimiento', class: 'status-warning' }
              };
              const status = statusLabels[row.status] || statusLabels['active'];
              return <span className={`status-badge ${status.class}`}>{status.label}</span>;
            } 
          },
          { header: "Acciones", body: (row) => <ManagementActionButtons row={row} onEdit={openEdit} onDelete={setDeleteConfirm} onView={setSelected} /> }
        ]}
        loading={loading}
        page={page}
        totalRecords={totalRecords}
        onPageChange={setPage}
        title={`Lista de Vehículos (${totalRecords})`}
        globalFilter={query}
        setGlobalFilter={setQuery}
        searchPlaceholder="Buscar por placas o modelo"
        headerElements={
          <Dropdown 
            value={statusFilter} 
            options={[
              { label: 'Todos', value: null },
              { label: 'Activos', value: 'active' },
              { label: 'Inactivos', value: 'inactive' },
              { label: 'En mantenimiento', value: 'maintenance' },
              { label: 'Eliminados', value: 'deleted' }
            ]} 
            optionLabel="label"
            optionValue="value"
            onChange={(e) => { setStatusFilter(e.value); setPage(1); }} 
            placeholder="Filtrar por estado" 
          />
        }
      />

        <DetailModal
          header="Detalles del Vehículo"
          visible={!!selected}
          onHide={() => setSelected(null)}
          icon="pi pi-car"
          title={`${selected?.brand} ${selected?.model}`}
          subtitle={`Placas: ${selected?.plate}`}
        >
          {selected && (
            <>
              <DetailField icon="pi pi-palette" label="Color">
                {selected.color}
              </DetailField>
              <DetailField icon="pi pi-users" label="Capacidad">
                {selected.capacity} pasajeros
              </DetailField>
              <DetailField icon="pi pi-info-circle" label="Estado">
                {selected.deleted_at ? (
                  <span className="status-badge status-inactivo" style={{ backgroundColor: '#e57373', color: '#fff' }}>Eliminado</span>
                ) : selected.status === 'active' ? (
                  <span className="status-badge status-activo">Activo</span>
                ) : selected.status === 'inactive' ? (
                  <span className="status-badge status-inactivo">Inactivo</span>
                ) : (
                  <span className="status-badge status-warning">Mantenimiento</span>
                )}
              </DetailField>
            </>
          )}
        </DetailModal>

        <Dialog blockScroll
          header={creating ? 'Registrar Nuevo Vehículo' : 'Editar Vehículo'}
          visible={creating || editing}
          style={{ width: '40rem' }}
          onHide={closeForm}
        >
          <div className="grid p-fluid pt-3">
            <div className="col-12 mb-3">
              <div className="flex flex-column gap-2">
                <label htmlFor="vehicle-plate" className="font-bold">Placas</label>
                <InputText
                  id="vehicle-plate"
                  value={form.plate}
                  onChange={(event) => setForm({ ...form, plate: event.target.value.toUpperCase() })}
                  className="w-full"
                  placeholder="Ej: ABC-1234"
                />
              </div>
            </div>

            <div className="col-12 md:col-6 mb-3">
              <div className="flex flex-column gap-2">
                <label htmlFor="vehicle-brand" className="font-bold">Marca</label>
                <InputText
                  id="vehicle-brand"
                  value={form.brand}
                  onChange={(event) => setForm({ ...form, brand: event.target.value })}
                  className="w-full"
                  placeholder="Ej: Toyota"
                />
              </div>
            </div>

            <div className="col-12 md:col-6 mb-3">
              <div className="flex flex-column gap-2">
                <label htmlFor="vehicle-model" className="font-bold">Modelo</label>
                <InputText
                  id="vehicle-model"
                  value={form.model}
                  onChange={(event) => setForm({ ...form, model: event.target.value })}
                  className="w-full"
                  placeholder="Ej: Corolla"
                />
              </div>
            </div>

            <div className="col-12 md:col-6 mb-3">
              <div className="flex flex-column gap-2">
                <label htmlFor="vehicle-color" className="font-bold">Color</label>
                <InputText
                  id="vehicle-color"
                  value={form.color}
                  onChange={(event) => setForm({ ...form, color: event.target.value })}
                  className="w-full"
                  placeholder="Ej: Blanco"
                />
              </div>
            </div>

            <div className="col-12 md:col-6 mb-3">
              <div className="flex flex-column gap-2">
                <label htmlFor="vehicle-capacity" className="font-bold">Capacidad (Pasajeros)</label>
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
            
            {editing && (
              <div className="col-12 mb-3">
                <div className="flex flex-column gap-2">
                  <label htmlFor="status" className="font-bold">Estado del Vehículo</label>
                  <Dropdown 
                    id="status" 
                    value={form.status} 
                    options={[
                      { label: 'Activo', value: 'active' },
                      { label: 'Inactivo', value: 'inactive' },
                      { label: 'En Mantenimiento', value: 'maintenance' }
                    ]}
                    onChange={(e) => setForm({ ...form, status: e.value })} 
                    className="w-full"
                    placeholder="Selecciona un estado"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="premium-modal-footer">
            <Button label="Cancelar" onClick={closeForm} className="p-button-text" />
            <Button label={creating ? 'Registrar' : 'Guardar'} onClick={handleSave} className="p-button-primary" loading={isSubmitting} />
          </div>
        </Dialog>

        <Dialog blockScroll
          header="Confirmar Eliminación"
          visible={!!deleteConfirm}
          style={{ width: '32rem' }}
          onHide={() => setDeleteConfirm(null)}
        >
          <p>¿Está seguro que desea eliminar este vehículo? Esta acción no se puede deshacer.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button label="Cancelar" onClick={() => setDeleteConfirm(null)} className="p-button-text" />
            <Button label="Eliminar" onClick={confirmDelete} className="p-button-danger" loading={isSubmitting} />
          </div>
        </Dialog>
      </div>
    </>
  );
}

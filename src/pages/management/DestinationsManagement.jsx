import { useEffect, useMemo, useRef, useState } from 'react';
import ManagementPageHeader from "../../components/management/ManagementPageHeader";
import { DetailModal, DetailField } from "../../components/ui/DetailModal";
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputSwitch } from 'primereact/inputswitch';
import DestinationMapPicker from '../../components/DestinationMapPicker';
import StatCardPremium from '../../components/StatCardPremium';
import CustomDataTable from "../../components/ui/CustomDataTable";
import ManagementActionButtons from "../../components/management/ManagementActionButtons";
import { fetchDestinations, createDestination, updateDestination, deleteDestination } from '../../services/adminService';

const DEFAULT_CENTER = [-0.9525, -80.7450];

const LOCAL_DESTINATIONS = [
  {
    id: 1,
    name: 'Puerta Uno',
    description: 'Acceso principal norte del campus',
    latitude: -0.9521,
    longitude: -80.7454,
    is_default: true,
  },
  {
    id: 2,
    name: 'Puerta Dos',
    description: 'Acceso principal sur del campus',
    latitude: -0.9529,
    longitude: -80.7447,
    is_default: true,
  },
  {
    id: 3,
    name: 'Centro de Servicio',
    description: 'Punto de espera y coordinación',
    latitude: -0.9525,
    longitude: -80.7450,
    is_default: true,
  },
];

const EMPTY_FORM = {
  id: null,
  name: '',
  description: '',
  latitude: '',
  longitude: '',
  address: '',
  is_default: false,
  is_active: true
};

function normalizeDestination(destination) {
  return {
    ...destination,
    latitude: Number.parseFloat(destination.latitude ?? destination.lat ?? ''),
    longitude: Number.parseFloat(destination.longitude ?? destination.lng ?? ''),
    address: destination.address || '',
    is_default: Boolean(destination.is_default),
  };
}

function formatCoordinate(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed.toFixed(6) : '—';
}

export default function DestinationsManagement() {
  const toast = useRef(null);
  const [destinations, setDestinations] = useState(LOCAL_DESTINATIONS);
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
  const [globalStats, setGlobalStats] = useState({ inactive: 0, deleted: 0 });

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
        const result = await fetchDestinations({ per_page: 10, page, search: debouncedQuery, status: statusFilter });
        const dataArray = result?.data || [];
        const normalized = dataArray.map(normalizeDestination).filter((destination) =>
          Number.isFinite(destination.latitude) && Number.isFinite(destination.longitude)
        );

        setDestinations(normalized);
        setTotalRecords(result?.total || 0);
        if (result?.total_inactivos !== undefined) {
          setGlobalStats({
            inactive: result.total_inactivos || 0,
            deleted: result.total_eliminados || 0,
          });
        }
      } catch (err) {
        console.error('Error al cargar destinos:', err);
        setDestinations([]);
        setTotalRecords(0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, debouncedQuery, statusFilter]);

  const openCreate = () => {
    setForm({
      ...EMPTY_FORM,
      latitude: String(DEFAULT_CENTER[0]),
      longitude: String(DEFAULT_CENTER[1]),
      address: '',
    });
    setCreating(true);
    setEditing(false);
  };

  const openEdit = (destination) => {
    setForm({
      id: destination.id,
      name: destination.name || '',
      description: destination.description || '',
      latitude: Number.isFinite(destination.latitude) ? String(destination.latitude) : '',
      longitude: Number.isFinite(destination.longitude) ? String(destination.longitude) : '',
      address: destination.address || '',
      is_default: Boolean(destination.is_default),
      is_active: destination.is_active !== undefined ? destination.is_active : true,
    });
    setEditing(true);
    setCreating(false);
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(false);
    setForm(EMPTY_FORM);
  };

  const handleMapChange = ({ latitude, longitude }) => {
    setForm((current) => ({
      ...current,
      latitude: Number.isFinite(latitude) ? String(latitude) : current.latitude,
      longitude: Number.isFinite(longitude) ? String(longitude) : current.longitude,
    }));
  };

  const handleSave = async () => {
    const latitude = Number.parseFloat(form.latitude);
    const longitude = Number.parseFloat(form.longitude);

    if (!form.name.trim() || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !form.address?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Datos incompletos',
        detail: 'Completa nombre, dirección, latitud y longitud.',
      });
      return;
    }
    if (form.address.trim().length < 5) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Dirección muy corta',
        detail: 'La dirección debe tener al menos 5 caracteres.',
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        latitude,
        longitude,
        address: form.address.trim(),
        is_default: form.is_default,
        is_active: form.is_active
      };

      if (editing) {
        const response = await updateDestination(form.id, payload);
        const normalized = normalizeDestination(response);
        setDestinations(destinations.map((destination) => (destination.id === form.id ? normalized : destination)));
        toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Destino actualizado correctamente' });
      } else {
        const response = await createDestination(payload);
        const normalized = normalizeDestination(response);
        setDestinations([...destinations, normalized]);
        toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Destino creado correctamente' });
      }
      closeForm();
    } catch (err) {
      console.error(err);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: err.response?.data?.error || err.response?.data?.message || 'Error al guardar destino.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (destination) => {
    setDeleteConfirm(destination);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) {
      return;
    }

    setLoading(true);
    try {
      await deleteDestination(deleteConfirm.id);
      setDestinations(destinations.filter((d) => d.id !== deleteConfirm.id));
      setDeleteConfirm(null);
      toast.current?.show({ severity: 'success', summary: 'Eliminado', detail: 'Destino eliminado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: err.response?.data?.error || 'No se pudo eliminar el destino.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      <div className="management-section">
        <ManagementPageHeader
          title="Destinos"
          subtitle="Gestión de puntos de destino en el mapa"
          icon="pi pi-map-marker"
          buttonLabel="Nuevo Destino"
          onButtonClick={openCreate}
        />

        <div className="dashboard-grid-premium">
          <StatCardPremium title="Total Destinos" value={totalRecords} icon="pi pi-map-marker" tone="blue" subtitle="Registrados en sistema" loading={loading} />
          <StatCardPremium title="Inactivos" value={globalStats.inactive} icon="pi pi-compass" tone="amber" subtitle="En el sistema" loading={loading} />
          <StatCardPremium title="Eliminados" value={globalStats.deleted} icon="pi pi-trash" tone="red" subtitle="En el sistema" loading={loading} />
        </div>

      <CustomDataTable
        value={destinations}
        columns={[
          { field: "name", header: "Nombre" },
          { header: "Descripción", body: (row) => row.description || 'Sin descripción' },
          { header: "Latitud", body: (row) => formatCoordinate(row.latitude) },
          { header: "Longitud", body: (row) => formatCoordinate(row.longitude) },
          { header: "Predeterminado", body: (row) => <span style={{ color: row.is_default ? '#2e7d32' : '#6b7280', fontWeight: 600 }}>{row.is_default ? 'Sí' : 'No'}</span> },
          { header: "Estado", body: (row) => {
              if (row.deleted_at) return <span className="status-badge status-inactivo" style={{ backgroundColor: '#e57373', color: '#fff' }}>Eliminado</span>;
              return <span className={`status-badge status-${row.is_active ? 'activo' : 'inactivo'}`}>{row.is_active ? 'Activo' : 'Inactivo'}</span>;
            } 
          },
          { header: "Acciones", body: (row) => <ManagementActionButtons row={row} onEdit={openEdit} onDelete={handleDelete} onView={setSelected} /> }
        ]}
        loading={loading}
        page={page}
        totalRecords={totalRecords}
        onPageChange={setPage}
        title={`Lista de Destinos (${totalRecords})`}
        globalFilter={query}
        setGlobalFilter={setQuery}
        searchPlaceholder="Buscar por nombre o descripción"
        headerElements={
          <Dropdown 
            value={statusFilter} 
            options={[
              { label: 'Todos', value: null },
              { label: 'Activos', value: 'active' },
              { label: 'Inactivos', value: 'inactive' },
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
          header="Detalles del Destino"
          visible={!!selected}
          onHide={() => setSelected(null)}
          icon="pi pi-map-marker"
          title={selected?.name}
          subtitle={selected?.description || 'Sin descripción'}
        >
          {selected && (
            <>
              <DetailField icon="pi pi-directions" label="Dirección">
                {selected.address || 'No registrada'}
              </DetailField>
              <DetailField icon="pi pi-compass" label="Latitud">
                {formatCoordinate(selected.latitude)}
              </DetailField>
              <DetailField icon="pi pi-compass" label="Longitud">
                {formatCoordinate(selected.longitude)}
              </DetailField>
              <DetailField icon="pi pi-star" label="Predeterminado">
                {selected.is_default ? 'Sí' : 'No'}
              </DetailField>
            </>
          )}
        </DetailModal>

        <Dialog blockScroll
          header={creating ? 'Crear Nuevo Destino' : 'Editar Destino'}
          visible={creating || editing}
          style={{ width: '58rem' }}
          onHide={closeForm}
          onShow={() => window.setTimeout(() => window.dispatchEvent(new Event('resize')), 100)}
        >
          <div style={{ display: 'grid', gap: '1rem' }}>
            <DestinationMapPicker
              value={form}
              destinations={destinations}
              onChange={handleMapChange}
              center={[
                Number.isFinite(Number.parseFloat(form.latitude)) ? Number.parseFloat(form.latitude) : DEFAULT_CENTER[0],
                Number.isFinite(Number.parseFloat(form.longitude)) ? Number.parseFloat(form.longitude) : DEFAULT_CENTER[1],
              ]}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="destination-name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nombre</label>
                <InputText
                  id="destination-name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  className="w-full"
                  placeholder="Puerta Uno"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="destination-address" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Dirección / Ubicación</label>
                <InputText
                  id="destination-address"
                  value={form.address || ''}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  className="w-full"
                  placeholder="Ej: Avenida Universitaria, Puerta Norte"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="destination-description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Descripción</label>
                <InputTextarea
                  id="destination-description"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  rows={4}
                  autoResize
                  className="w-full"
                  placeholder="Describe el punto o referencia"
                />
              </div>

              <div>
                <label htmlFor="destination-latitude" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Latitud</label>
                <InputText
                  id="destination-latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={(event) => setForm({ ...form, latitude: event.target.value })}
                  className="w-full"
                  placeholder="-0.952500"
                />
              </div>

              <div>
                <label htmlFor="destination-longitude" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Longitud</label>
                <InputText
                  id="destination-longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(event) => setForm({ ...form, longitude: event.target.value })}
                  className="w-full"
                  placeholder="-80.745000"
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(event) => setForm({ ...form, is_default: event.target.checked })}
                  />
                  <span style={{ fontWeight: 600 }}>Marcar como destino predeterminado</span>
                </label>
              </div>

              {editing && (
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
                  <InputSwitch 
                    id="is_active" 
                    checked={form.is_active} 
                    onChange={(e) => setForm({ ...form, is_active: e.value })} 
                  />
                  <label htmlFor="is_active" style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>
                    Activo
                  </label>
                </div>
              )}
            </div>

          </div>
          <div className="premium-modal-footer">
            <Button label="Cancelar" onClick={closeForm} className="p-button-text" />
            <Button label={creating ? 'Crear' : 'Guardar'} onClick={handleSave} className="p-button-primary" />
          </div>
        </Dialog>

        <Dialog blockScroll
          header="Confirmar Eliminación"
          visible={!!deleteConfirm}
          style={{ width: '32rem' }}
          onHide={() => setDeleteConfirm(null)}
        >
          <p>¿Está seguro que desea eliminar este destino? Esta acción no se puede deshacer.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button label="Cancelar" onClick={() => setDeleteConfirm(null)} className="p-button-text" />
            <Button label="Eliminar" onClick={confirmDelete} className="p-button-danger" />
          </div>
        </Dialog>
      </div>
    </>
  );
}
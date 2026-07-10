import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import DestinationMapPicker from '../../components/DestinationMapPicker';
import { fetchDestinations, createDestination, updateDestination, deleteDestination, restoreDestination } from '../../services/adminService';

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const result = await fetchDestinations();
        const normalized = (result || []).map(normalizeDestination).filter((destination) =>
          Number.isFinite(destination.latitude) && Number.isFinite(destination.longitude)
        );

        setDestinations(normalized.length ? normalized : LOCAL_DESTINATIONS);
      } catch {
        setDestinations(LOCAL_DESTINATIONS);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return destinations.filter((destination) => {
      const text = [destination.name, destination.description, destination.latitude, destination.longitude]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(normalizedQuery);
    });
  }, [destinations, query]);

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
        address: form.address.trim()
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
      setDestinations(destinations.map((d) => d.id === deleteConfirm.id ? { ...d, deleted_at: new Date().toISOString() } : d));
      setDeleteConfirm(null);
      toast.current?.show({ severity: 'success', summary: 'Suspendido', detail: 'Destino suspendido correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: err.response?.data?.error || 'No se pudo suspender el destino.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (row) => {
    setLoading(true);
    try {
      await restoreDestination(row.id);
      setDestinations(destinations.map((d) => d.id === row.id ? { ...d, deleted_at: null } : d));
      toast.current?.show({ severity: 'success', summary: 'Restaurado', detail: 'Destino restaurado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.error || 'No se pudo restaurar el destino' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toast ref={toast} />

      <div className="management-section">
        <div className="management-header">
          <i className="pi pi-map-marker" />
          <div className="management-header-content">
            <h2>Destinos</h2>
            <p>Administración de puntos predeterminados y destinos nuevos</p>
          </div>
        </div>

        <Card className="management-table">
          <div className="management-toolbar">
            <h3>Lista de Destinos ({filtered.length})</h3>
            <div className="management-toolbar-actions">
              <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nombre o descripción"
                />
              </span>
              <Button label="Nuevo Destino" icon="pi pi-plus" className="p-button-primary" onClick={openCreate} />
            </div>
          </div>

          <DataTable value={filtered} paginator rows={10} loading={loading} responsiveLayout="scroll" stripedRows emptyMessage="No hay destinos registrados">
            <Column field="name" header="Nombre" sortable />
            <Column field="description" header="Descripción" body={(row) => row.description || 'Sin descripción'} />
            <Column header="Latitud" body={(row) => formatCoordinate(row.latitude)} />
            <Column header="Longitud" body={(row) => formatCoordinate(row.longitude)} />
            <Column
              header="Predeterminado"
              body={(row) => (
                <span style={{ color: row.is_default ? '#2e7d32' : '#6b7280', fontWeight: 600 }}>
                  {row.is_default ? 'Sí' : 'No'}
                </span>
              )}
            />
            <Column
              header="Estado"
              body={(row) => {
                if (row.deleted_at) {
                  return <span className="status-badge status-inactivo" style={{ backgroundColor: '#e57373', color: '#fff' }}>Suspendido</span>;
                }
                return (
                  <span className={`status-badge status-${row.is_active ? 'activo' : 'inactivo'}`}>
                    {row.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                );
              }}
            />
            <Column
              header="Acciones"
              body={(row) => (
                <div className="action-buttons">
                  <Button size="small" icon="pi pi-eye" text onClick={() => setSelected(row)} title="Ver" />
                  {!row.deleted_at ? (
                    <>
                      <Button size="small" icon="pi pi-pencil" text className="p-button-warning" onClick={() => openEdit(row)} title="Editar" />
                      <Button size="small" icon="pi pi-ban" text className="p-button-danger" onClick={() => handleDelete(row)} title="Suspender" />
                    </>
                  ) : (
                    <Button size="small" icon="pi pi-refresh" text className="p-button-success" onClick={() => handleRestore(row)} title="Restaurar" />
                  )}
                </div>
              )}
            />
          </DataTable>
        </Card>

        <Dialog
          header="Detalles del Destino"
          visible={!!selected}
          style={{ width: '32rem' }}
          onHide={() => setSelected(null)}
        >
          {selected && (
            <div className="user-detail">
              <p><strong>Nombre:</strong> {selected.name}</p>
              <p><strong>Descripción:</strong> {selected.description || 'No registrada'}</p>
              <p><strong>Dirección:</strong> {selected.address || 'No registrada'}</p>
              <p><strong>Latitud:</strong> {formatCoordinate(selected.latitude)}</p>
              <p><strong>Longitud:</strong> {formatCoordinate(selected.longitude)}</p>
              <p><strong>Predeterminado:</strong> {selected.is_default ? 'Sí' : 'No'}</p>
            </div>
          )}
        </Dialog>

        <Dialog
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
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
              <Button label="Cancelar" onClick={closeForm} className="p-button-text" />
              <Button label={creating ? 'Crear' : 'Guardar'} onClick={handleSave} className="p-button-primary" />
            </div>
          </div>
        </Dialog>

        <Dialog
          header="Confirmar suspensión"
          visible={!!deleteConfirm}
          style={{ width: '32rem' }}
          onHide={() => setDeleteConfirm(null)}
        >
          <p>¿Está seguro que desea suspender este destino? Podrá restaurarlo más adelante.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
            <Button label="Cancelar" onClick={() => setDeleteConfirm(null)} className="p-button-text" />
            <Button label="Suspender" onClick={confirmDelete} className="p-button-danger" />
          </div>
        </Dialog>
      </div>
    </>
  );
}
import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { fetchUsers, createUserDriver, updateUser, deleteUser, toggleUserStatus, restoreUser } from '../../services/adminService';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useRef } from 'react';

// Mock data for development
const MOCK_DRIVERS = [
  { id: 1, name: 'Pedro González', email: 'pedro@conductor.local', phone: '+593 98 111 2222', vehicle: 'Toyota Corolla Cross 2022', rating: 4.8, is_active: true, created_at: '2024-01-10' },
  { id: 2, name: 'Ana Rodríguez', email: 'ana@conductor.local', phone: '+593 99 222 3333', vehicle: 'Honda CR-V 2021', rating: 4.6, is_active: true, created_at: '2024-01-15' },
  { id: 3, name: 'Miguel Sánchez', email: 'miguel@conductor.local', phone: '+593 97 333 4444', vehicle: 'Chevrolet D-Max 2023', rating: 4.9, is_active: true, created_at: '2024-01-20' },
  { id: 4, name: 'Laura Pérez', email: 'laura@conductor.local', phone: '+593 98 444 5555', vehicle: 'Kia Sportage 2020', rating: 4.7, is_active: false, created_at: '2024-02-01' },
];

export default function DriversManagement() {
  const toast = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '', vehicle: '', rating: 4.5, is_active: true });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchUsers();
        const drivers = result.filter(u => (u.role || u.rol?.rol_name || 'pasajero').toLowerCase() === 'conductor');
        setUsers(drivers);
      } catch {
        // Use mock data on error
        setUsers(MOCK_DRIVERS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.name} ${u.email} ${u.vehicle || ''}`.toLowerCase().includes(q));
  }, [users, query]);

  const statusBody = (row) => {
    if (row.deleted_at) {
      return <span className="status-badge status-inactivo" style={{ backgroundColor: '#e57373', color: '#fff' }}>Suspendido</span>;
    }
    return (
      <span className={`status-badge status-${row.is_active ? 'activo' : 'inactivo'}`}>
        {row.is_active ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  const ratingBody = (row) => {
    const rating = row.rating || 4.5;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span>{rating.toFixed(1)}</span>
        <div style={{ color: '#ff9800' }}>
          {'⭐'.repeat(Math.floor(rating))}
        </div>
      </div>
    );
  };

  const handleEdit = (row) => {
    setEditing(row.id);
    setEditForm({ ...row });
  };

  const handleSave = async () => {
    if (!editForm.name?.trim() || !editForm.email?.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Datos incompletos', detail: 'Por favor, rellena nombre y correo.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Guardar cambios en el backend (nombre y correo)
      const response = await updateUser(editForm.id, {
        name: editForm.name,
        email: editForm.email
      });

      // 2. Si el estado "activo" cambió, ejecutar el toggle
      const original = users.find(u => u.id === editForm.id);
      if (original && original.is_active !== editForm.is_active) {
        await toggleUserStatus(editForm.id);
      }

      const merged = { ...editForm, ...response.user };
      setUsers(users.map(u => u.id === editForm.id ? merged : u));
      setEditing(null);
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Conductor actualizado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error al actualizar', detail: err.response?.data?.error || 'Error en el servidor' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (row) => {
    setDeleteConfirm(row.id);
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await deleteUser(deleteConfirm);
      setUsers(users.map(u => u.id === deleteConfirm ? { ...u, deleted_at: new Date().toISOString() } : u));
      setDeleteConfirm(null);
      toast.current?.show({ severity: 'success', summary: 'Suspendido', detail: 'Conductor suspendido correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.error || 'No se pudo suspender al conductor' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (row) => {
    setLoading(true);
    try {
      await restoreUser(row.id);
      setUsers(users.map(u => u.id === row.id ? { ...u, deleted_at: null } : u));
      toast.current?.show({ severity: 'success', summary: 'Restaurado', detail: 'Conductor restaurado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.error || 'No se pudo restaurar al conductor' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCreating(true);
    setCreateForm({ name: '', email: '', password: '', phone: '', vehicle: '', rating: 4.5, is_active: true });
  };

  const handleCreateSave = async () => {
    if (!createForm.name?.trim() || !createForm.email?.trim() || !createForm.password?.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Datos incompletos', detail: 'Por favor complete nombre, correo y contraseña.' });
      return;
    }
    if (createForm.password.length < 8) {
      toast.current?.show({ severity: 'warn', summary: 'Contraseña muy corta', detail: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }

    setLoading(true);
    try {
      const response = await createUserDriver({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password
      });

      const merged = {
        ...response,
        phone: createForm.phone,
        vehicle: createForm.vehicle,
        rating: createForm.rating,
        created_at: new Date().toISOString()
      };

      setUsers([...users, merged]);
      setCreating(false);
      toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Conductor creado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error al crear', detail: err.response?.data?.error || err.response?.data?.message || 'Error del servidor' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="management-loading">
        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
      </div>
    );
  }

  return (
    <>
    <Toast ref={toast} />
    <div className="management-section">
      <div className="management-header">
        <i className="pi pi-car" />
        <div className="management-header-content">
          <h2>Conductores</h2>
          <p>Gestión de conductores y sus vehículos</p>
        </div>
      </div>

      <Card className="management-table">
        <div className="management-toolbar">
          <h3>Lista de Conductores ({filtered.length})</h3>
          <div className="management-toolbar-actions">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Buscar por nombre, correo o vehículo" 
              />
            </span>
            <Button label="Nuevo Conductor" icon="pi pi-plus" className="p-button-primary" onClick={handleCreate} />
          </div>
        </div>

        <DataTable 
          value={filtered} 
          paginator 
          rows={10} 
          loading={loading} 
          stripedRows 
          responsiveLayout="scroll"
        >
          <Column field="name" header="Nombre" sortable />
          <Column field="email" header="Correo" sortable />
          <Column field="phone" header="Teléfono" />
          <Column field="vehicle" header="Vehículo" />
          <Column header="Calificación" body={ratingBody} />
          <Column header="Estado" body={statusBody} />
          <Column
            header="Acciones"
            body={(row) => (
              <div className="action-buttons">
                <Button 
                  size="small" 
                  icon="pi pi-eye" 
                  text 
                  onClick={() => setSelected(row)}
                  title="Ver detalles"
                />
                {!row.deleted_at ? (
                  <>
                    <Button 
                      size="small" 
                      icon="pi pi-pencil" 
                      text 
                      className="p-button-warning"
                      onClick={() => handleEdit(row)}
                      title="Editar"
                    />
                    <Button 
                      size="small" 
                      icon="pi pi-ban" 
                      text 
                      className="p-button-danger"
                      onClick={() => handleDelete(row)}
                      title="Suspender"
                    />
                  </>
                ) : (
                  <Button 
                    size="small" 
                    icon="pi pi-refresh" 
                    text 
                    className="p-button-success"
                    onClick={() => handleRestore(row)}
                    title="Restaurar"
                  />
                )}
              </div>
            )}
          />
        </DataTable>
      </Card>

      <Dialog
        header="Detalles del Conductor"
        visible={!!selected}
        style={{ width: '32rem' }}
        onHide={() => setSelected(null)}
      >
        {selected && (
          <div className="user-detail">
            <p><strong>Nombre:</strong> {selected.name}</p>
            <p><strong>Correo:</strong> {selected.email}</p>
            <p><strong>Teléfono:</strong> {selected.phone || 'No registrado'}</p>
            <p><strong>Vehículo:</strong> {selected.vehicle || 'No registrado'}</p>
            <p><strong>Licencia:</strong> {selected.license || 'No registrada'}</p>
            <p><strong>Calificación:</strong> <span style={{ color: '#ff9800' }}>{'⭐'.repeat(Math.floor(selected.rating || 4))} ({(selected.rating || 4).toFixed(1)})</span></p>
            <p><strong>Estado:</strong> {selected.is_active ? '✓ Activo' : '✗ Inactivo'}</p>
            <p><strong>Registrado:</strong> {new Date(selected.created_at).toLocaleDateString('es-ES')}</p>
          </div>
        )}
      </Dialog>

      <Dialog
        header="Editar Conductor"
        visible={!!editing}
        style={{ width: '32rem' }}
        onHide={() => setEditing(null)}
      >
        {editForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Nombre</strong></label>
              <InputText
                id="name"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Correo</strong></label>
              <InputText
                id="email"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Teléfono</strong></label>
              <InputText
                id="phone"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="vehicle" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Vehículo</strong></label>
              <InputText
                id="vehicle"
                value={editForm.vehicle || ''}
                onChange={(e) => setEditForm({ ...editForm, vehicle: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="rating" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Calificación</strong></label>
              <InputNumber
                id="rating"
                value={editForm.rating || 4.0}
                onValueChange={(e) => setEditForm({ ...editForm, rating: e.value })}
                min={0}
                max={5}
                step={0.1}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label htmlFor="is_active"><strong>Activo</strong></label>
              <InputSwitch
                id="is_active"
                checked={editForm.is_active || false}
                onChange={(e) => setEditForm({ ...editForm, is_active: e.value })}
              />
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button label="Cancelar" onClick={() => setEditing(null)} className="p-button-text" />
              <Button label="Guardar" onClick={handleSave} className="p-button-primary" />
            </div>
          </div>
        )}
      </Dialog>

      <Dialog
        header="Confirmar suspensión"
        visible={!!deleteConfirm}
        style={{ width: '32rem' }}
        onHide={() => setDeleteConfirm(null)}
      >
        <div style={{ marginBottom: '1rem' }}>
          <p>¿Está seguro que desea suspender este conductor? Podrá restaurarlo más adelante.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button label="Cancelar" onClick={() => setDeleteConfirm(null)} className="p-button-text" />
          <Button label="Suspender" onClick={confirmDelete} className="p-button-danger" />
        </div>
      </Dialog>

      <Dialog
        header="Crear Nuevo Conductor"
        visible={creating}
        style={{ width: '32rem' }}
        onHide={() => setCreating(false)}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="createName" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Nombre</strong></label>
            <InputText
              id="createName"
              value={createForm.name || ''}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label htmlFor="createEmail" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Correo</strong></label>
            <InputText
              id="createEmail"
              value={createForm.email || ''}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full"
              placeholder="correo@example.com"
            />
          </div>
          <div>
            <label htmlFor="createPassword" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Contraseña</strong></label>
            <InputText
              id="createPassword"
              type="password"
              value={createForm.password || ''}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label htmlFor="createPhone" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Teléfono</strong></label>
            <InputText
              id="createPhone"
              value={createForm.phone || ''}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              className="w-full"
              placeholder="+593 98 123 4567"
            />
          </div>
          <div>
            <label htmlFor="createVehicle" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Vehículo</strong></label>
            <InputText
              id="createVehicle"
              value={createForm.vehicle || ''}
              onChange={(e) => setCreateForm({ ...createForm, vehicle: e.target.value })}
              className="w-full"
              placeholder="Ej: Toyota Corolla Cross 2022"
            />
          </div>
          <div>
            <label htmlFor="createRating" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Calificación</strong></label>
            <InputNumber
              id="createRating"
              value={createForm.rating || 4.5}
              onValueChange={(e) => setCreateForm({ ...createForm, rating: e.value })}
              min={0}
              max={5}
              step={0.1}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label htmlFor="createActive"><strong>Activo</strong></label>
            <InputSwitch
              id="createActive"
              checked={createForm.is_active || false}
              onChange={(e) => setCreateForm({ ...createForm, is_active: e.value })}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Button label="Cancelar" onClick={() => setCreating(false)} className="p-button-text" />
            <Button label="Crear" onClick={handleCreateSave} className="p-button-primary" />
          </div>
        </div>
      </Dialog>
    </div>
    </>
  );
}

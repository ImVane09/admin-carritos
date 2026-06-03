import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Toast } from 'primereact/toast';
import { fetchUsers, registerPassenger, updateUser, deleteUser, toggleUserStatus, restoreUser } from '../../services/adminService';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useRef } from 'react';

// Mock data for development
const MOCK_PASSENGERS = [
  { id: 1, name: 'Sofía Martínez', email: 'sofia@passenger.local', phone: '+593 98 555 6666', city: 'Quito', address: 'Av. de los Shyris y Naciones Unidas', is_active: true, trips_count: 12, created_at: '2024-01-05' },
  { id: 2, name: 'David López', email: 'david@passenger.local', phone: '+593 99 666 7777', city: 'Guayaquil', address: 'Av. Francisco de Orellana y Juan Tanca Marengo', is_active: true, trips_count: 8, created_at: '2024-01-12' },
  { id: 3, name: 'Elena García', email: 'elena@passenger.local', phone: '+593 97 777 8888', city: 'Cuenca', address: 'Av. Ordóñez Lasso y 12 de Abril', is_active: true, trips_count: 5, created_at: '2024-01-18' },
  { id: 4, name: 'Roberto Fernández', email: 'roberto@passenger.local', phone: '+593 98 888 9999', city: 'Ambato', address: 'Av. Cevallos y Martínez', is_active: false, trips_count: 3, created_at: '2024-02-02' },
  { id: 5, name: 'Lucía Sánchez', email: 'lucia@passenger.local', phone: '+593 99 000 1111', city: 'Manta', address: 'Malecón y Flavio Reyes', is_active: true, trips_count: 15, created_at: '2024-02-08' },
];

export default function PassengersManagement() {
  const toast = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', phone: '', city: '', address: '', is_active: true });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchUsers();
        const passengers = result.filter(u => (u.role || u.rol?.rol_name || 'pasajero').toLowerCase() === 'pasajero');
        setUsers(passengers);
      } catch {
        // Use mock data on error
        setUsers(MOCK_PASSENGERS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(q));
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
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Pasajero actualizado correctamente' });
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
      toast.current?.show({ severity: 'success', summary: 'Suspendido', detail: 'Pasajero suspendido correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.error || 'No se pudo suspender al pasajero' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (row) => {
    setLoading(true);
    try {
      await restoreUser(row.id);
      setUsers(users.map(u => u.id === row.id ? { ...u, deleted_at: null } : u));
      toast.current?.show({ severity: 'success', summary: 'Restaurado', detail: 'Pasajero restaurado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.error || 'No se pudo restaurar al pasajero' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCreating(true);
    setCreateForm({ name: '', email: '', password: '', phone: '', city: '', address: '', is_active: true });
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
      // Registramos usando el endpoint público /api/register con role_id = 2 (pasajero)
      const response = await registerPassenger({
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        password_confirmation: createForm.password,
        role_id: 2
      });

      const merged = {
        ...response.user,
        phone: createForm.phone,
        city: createForm.city,
        address: createForm.address,
        trips_count: 0,
        created_at: new Date().toISOString()
      };

      setUsers([...users, merged]);
      setCreating(false);
      toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Pasajero creado correctamente' });
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
        <i className="pi pi-users" />
        <div className="management-header-content">
          <h2>Pasajeros</h2>
          <p>Gestión de cuentas de pasajeros</p>
        </div>
      </div>

      <Card className="management-table">
        <div className="management-toolbar">
          <h3>Lista de Pasajeros ({filtered.length})</h3>
          <div className="management-toolbar-actions">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Buscar por nombre o correo" 
              />
            </span>
            <Button label="Nuevo Pasajero" icon="pi pi-plus" className="p-button-primary" onClick={handleCreate} />
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
          <Column field="city" header="Ciudad" />
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
        header="Detalles del Pasajero"
        visible={!!selected}
        style={{ width: '32rem' }}
        onHide={() => setSelected(null)}
      >
        {selected && (
          <div className="user-detail">
            <p><strong>Nombre:</strong> {selected.name}</p>
            <p><strong>Correo:</strong> {selected.email}</p>
            <p><strong>Teléfono:</strong> {selected.phone || 'No registrado'}</p>
            <p><strong>Ciudad:</strong> {selected.city || 'No registrada'}</p>
            <p><strong>Dirección:</strong> {selected.address || 'No registrada'}</p>
            <p><strong>Estado:</strong> {selected.is_active ? '✓ Activo' : '✗ Inactivo'}</p>
            <p><strong>Registrado:</strong> {new Date(selected.created_at).toLocaleDateString('es-ES')}</p>
            <p><strong>Viajes:</strong> {selected.trips_count || 0} viajes</p>
          </div>
        )}
      </Dialog>

      <Dialog
        header="Editar Pasajero"
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
              <label htmlFor="city" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Ciudad</strong></label>
              <InputText
                id="city"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="address" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Dirección</strong></label>
              <InputText
                id="address"
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                className="w-full"
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
          <p>¿Está seguro que desea suspender este pasajero? Podrá restaurarlo más adelante.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button label="Cancelar" onClick={() => setDeleteConfirm(null)} className="p-button-text" />
          <Button label="Suspender" onClick={confirmDelete} className="p-button-danger" />
        </div>
      </Dialog>

      <Dialog
        header="Crear Nuevo Pasajero"
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
            <label htmlFor="createCity" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Ciudad</strong></label>
            <InputText
              id="createCity"
              value={createForm.city || ''}
              onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
              className="w-full"
              placeholder="Quito"
            />
          </div>
          <div>
            <label htmlFor="createAddress" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Dirección</strong></label>
            <InputText
              id="createAddress"
              value={createForm.address || ''}
              onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              className="w-full"
              placeholder="Av. de los Shyris y Naciones Unidas"
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

import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { fetchUsers, updateUser, deleteUser, toggleUserStatus, restoreUser } from '../../services/adminService';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useRef } from 'react';

// Mock data for development
const MOCK_ADMINS = [
  { id: 1, name: 'Juan Pérez', email: 'juan@carritos.admin', phone: '+593 98 123 4567', is_active: true, created_at: '2024-01-15' },
  { id: 2, name: 'María Torres', email: 'maria@carritos.admin', phone: '+593 99 234 5678', is_active: true, created_at: '2024-02-20' },
  { id: 3, name: 'Carlos Vega', email: 'carlos@carritos.admin', phone: '+593 97 345 6789', is_active: false, created_at: '2024-03-10' },
];

export default function AdminsManagement() {
  const toast = useRef(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', phone: '', is_active: true });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchUsers();
        const admins = result.filter(u => (u.role || u.rol?.rol_name || 'pasajero').toLowerCase() === 'admin');
        setUsers(admins);
      } catch {
        // Use mock data on error
        setUsers(MOCK_ADMINS);
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
      toast.current?.show({ severity: 'success', summary: 'Éxito', detail: 'Administrador actualizado correctamente' });
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
      toast.current?.show({ severity: 'success', summary: 'Suspendido', detail: 'Administrador suspendido correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.error || 'No se pudo suspender al administrador' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (row) => {
    setLoading(true);
    try {
      await restoreUser(row.id);
      setUsers(users.map(u => u.id === row.id ? { ...u, deleted_at: null } : u));
      toast.current?.show({ severity: 'success', summary: 'Restaurado', detail: 'Administrador restaurado correctamente' });
    } catch (err) {
      console.error(err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.error || 'No se pudo restaurar al administrador' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    toast.current?.show({ 
      severity: 'warn', 
      summary: 'Acceso Restringido', 
      detail: 'La creación de administradores está deshabilitada en la API por seguridad. Debe realizarse por base de datos.' 
    });
  };

  const handleCreateSave = () => {
    setCreating(false);
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
        <i className="pi pi-shield" />
        <div className="management-header-content">
          <h2>Administradores</h2>
          <p>Gestión de cuentas administrativas del sistema</p>
        </div>
      </div>

      <Card className="management-table">
        <div className="management-toolbar">
          <h3>Lista de Administradores ({filtered.length})</h3>
          <div className="management-toolbar-actions">
            <span className="p-input-icon-left">
              <i className="pi pi-search" />
              <InputText 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Buscar por nombre o correo" 
              />
            </span>
            <Button label="Nuevo Admin" icon="pi pi-plus" className="p-button-primary" onClick={handleCreate} />
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
        header="Detalles del Administrador"
        visible={!!selected}
        style={{ width: '32rem' }}
        onHide={() => setSelected(null)}
      >
        {selected && (
          <div className="user-detail">
            <p><strong>Nombre:</strong> {selected.name}</p>
            <p><strong>Correo:</strong> {selected.email}</p>
            <p><strong>Teléfono:</strong> {selected.phone || 'No registrado'}</p>
            <p><strong>Rol:</strong> <span className="role-badge role-admin"><i className="pi pi-shield" /> Administrador</span></p>
            <p><strong>Estado:</strong> {selected.is_active ? 'Activo' : 'Inactivo'}</p>
            <p><strong>Registrado:</strong> {new Date(selected.created_at).toLocaleDateString('es-ES')}</p>
          </div>
        )}
      </Dialog>

      <Dialog
        header="Editar Administrador"
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
          <p>¿Está seguro que desea suspender este administrador? Podrá restaurarlo más adelante.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button label="Cancelar" onClick={() => setDeleteConfirm(null)} className="p-button-text" />
          <Button label="Suspender" onClick={confirmDelete} className="p-button-danger" />
        </div>
      </Dialog>

      <Dialog
        header="Crear Nuevo Administrador"
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
            <label htmlFor="createPhone" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Teléfono</strong></label>
            <InputText
              id="createPhone"
              value={createForm.phone || ''}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              className="w-full"
              placeholder="+593 98 123 4567"
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

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
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', is_active: true });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await fetchUsers();
        const drivers = result.filter(u => (u.role || u.rol?.rol_name || 'pasajero').toLowerCase() === 'conductor');
        setUsers(drivers);
      } catch (err) {
        console.error('Error al cargar conductores:', err);
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los conductores desde el servidor.'
        });
        setUsers([]);
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
    setEditForm({ ...row, password: '' });
  };

  const handleSave = async () => {
    if (!editForm.name?.trim() || !editForm.email?.trim()) {
      toast.current?.show({ severity: 'warn', summary: 'Datos incompletos', detail: 'Por favor, rellena nombre y correo.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Guardar cambios en el backend
      const payload = {
        name: editForm.name,
        email: editForm.email
      };
      if (editForm.password?.trim()) {
        payload.password = editForm.password.trim();
      }
      const response = await updateUser(editForm.id, payload);

      // 2. Si el estado "activo" cambió, ejecutar el toggle
      const original = users.find(u => u.id === editForm.id);
      let activeState = !!editForm.is_active;
      if (original && (!!original.is_active !== !!editForm.is_active)) {
        const toggleRes = await toggleUserStatus(editForm.id);
        if (toggleRes && toggleRes.user) {
          activeState = !!toggleRes.user.is_active;
        }
      }

      const merged = { 
        ...editForm, 
        ...response.user,
        is_active: activeState
      };
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
    setCreateForm({ name: '', email: '', password: '', is_active: true });
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
                placeholder="Buscar por nombre o correo" 
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
        style={{ width: '30rem' }}
        onHide={() => setSelected(null)}
        dismissableMask
      >
        {selected && (
          <div className="user-detail-card" style={{ padding: '0.5rem 0' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--brand-700)',
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  margin: '0 auto 0.5rem auto',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                }}
              >
                {selected.name?.slice(0, 1).toUpperCase()}
              </div>
              <h3 style={{ margin: '0.3rem 0', color: 'var(--brand-900)', fontSize: '1.35rem', fontWeight: '600' }}>{selected.name}</h3>
              <p style={{ color: 'var(--ink-500)', fontSize: '0.85rem', margin: 0 }}>ID de Conductor: #{selected.id}</p>
            </div>

            <div style={{ display: 'grid', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="pi pi-envelope" style={{ color: 'var(--brand-500)' }} /> Correo Electrónico:
                </span>
                <strong style={{ color: 'var(--ink-900)', wordBreak: 'break-all', marginLeft: '1rem', textAlign: 'right' }}>{selected.email}</strong>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="pi pi-star-fill" style={{ color: '#ff9800' }} /> Calificación:
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ff9800', fontWeight: 'bold' }}>
                  {'⭐'.repeat(Math.floor(parseFloat(selected.score || 5)))} ({(parseFloat(selected.score || 5)).toFixed(1)})
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="pi pi-check-circle" style={{ color: 'var(--brand-500)' }} /> Estado de cuenta:
                </span>
                <span className={`status-badge status-${selected.is_active ? 'activo' : 'inactivo'}`} style={{ margin: 0 }}>
                  {selected.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--ink-500)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="pi pi-calendar" style={{ color: 'var(--brand-500)' }} /> Fecha de Registro:
                </span>
                <strong style={{ color: 'var(--ink-900)' }}>
                  {new Date(selected.created_at).toLocaleDateString('es-ES', {
                    dateStyle: 'medium'
                  })}
                </strong>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <Button
                label="Cancelar"
                onClick={() => setSelected(null)}
                className="p-button-text"
                style={{ borderRadius: '8px' }}
              />
            </div>
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
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}><strong>Nueva Contraseña (Opcional)</strong></label>
              <InputText
                id="password"
                type="password"
                value={editForm.password || ''}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                className="w-full"
                placeholder="Dejar vacío para no cambiar"
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
        visible={!!deleteConfirm}
        style={{ width: '26rem', borderRadius: '16px' }}
        onHide={() => setDeleteConfirm(null)}
        showHeader={false}
      >
        <div style={{ padding: '1.5rem 1rem 1rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: '3.25rem',
            height: '3.25rem',
            borderRadius: '50%',
            backgroundColor: '#fee2e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#dc2626',
            fontSize: '1.5rem',
            marginBottom: '1rem',
            boxShadow: '0 4px 10px rgba(220, 38, 38, 0.15)'
          }}>
            <i className="pi pi-exclamation-triangle" />
          </div>
          
          <h3 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '1.2rem',
            fontWeight: 700,
            color: '#0f172a',
            fontFamily: "'Outfit', sans-serif"
          }}>
            ¿Confirmar suspensión?
          </h3>
          
          <p style={{
            margin: '0 0 1.5rem 0',
            fontSize: '0.9rem',
            color: '#64748b',
            lineHeight: '1.45',
            fontFamily: "'Outfit', sans-serif"
          }}>
            ¿Está seguro que desea suspender a este conductor? Podrá restaurarlo o volver a activarlo en cualquier momento más adelante.
          </p>
          
          <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
            <Button
              label="Cancelar"
              onClick={() => setDeleteConfirm(null)}
              className="p-button-text"
              style={{ flex: 1, borderRadius: '8px' }}
            />
            <Button
              label="Suspender"
              onClick={confirmDelete}
              style={{
                flex: 1,
                borderRadius: '8px',
                backgroundColor: '#dc2626',
                border: 'none',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.65rem 0',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
              }}
            />
          </div>
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

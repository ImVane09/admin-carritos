import { useEffect, useRef, useState } from 'react';
import ManagementPageHeader from "../../components/management/ManagementPageHeader";
import { DetailModal, DetailField } from "../../components/ui/DetailModal";
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import CustomDataTable from "../../components/ui/CustomDataTable";
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { fetchDriverProfiles, createDriverProfile, updateDriverProfile, deleteDriverProfile, fetchUsers, fetchVehicles, fetchShifts } from '../../services/adminService';
import { InputSwitch } from 'primereact/inputswitch';
import { Skeleton } from 'primereact/skeleton';
import StatCardPremium from '../../components/StatCardPremium';

const EMPTY_FORM = { id: null, user_id: null, vehicle_id: null, shift_id: null, is_active: true };

export default function AssignmentsManagement() {
  const toast = useRef(null);
  
  const [profiles, setProfiles] = useState([]);
  const [driversState, setDriversState] = useState({ items: [], total: 0, loading: false, page: 1 });
  const [vehiclesState, setVehiclesState] = useState({ items: [], total: 0, loading: false, page: 1 });
  const [shiftsState, setShiftsState] = useState({ items: [], total: 0, loading: false, page: 1 });
  
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalStats, setGlobalStats] = useState({ inactive: 0, deleted: 0 });
  const [page, setPage] = useState(1);
  const rows = 10;
  
  // Modal states
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selected, setSelected] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesData] = await Promise.all([
        fetchDriverProfiles({ page: page, per_page: rows })
      ]);
      
      setProfiles(profilesData?.data || []);
      setTotalRecords(profilesData?.total || 0);
      if (profilesData?.total_inactivos !== undefined) {
        setGlobalStats({
          inactive: profilesData.total_inactivos || 0,
          deleted: profilesData.total_eliminados || 0,
          total: profilesData.total_registrados || 0,
        });
      }
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los datos.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const loadDriversPage = async (pageToLoad = 1) => {
    if (driversState.loading) return;
    setDriversState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetchUsers({ role_name: 'conductor', page: pageToLoad, per_page: 10, status: 'active' });
      const newItems = res.data || [];
      const total = res.total || newItems.length;
      
      setDriversState(prev => ({
        items: pageToLoad === 1 ? newItems : [...prev.items, ...newItems],
        total,
        page: pageToLoad,
        loading: false
      }));
    } catch (e) {
      setDriversState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadVehiclesPage = async (pageToLoad = 1) => {
    if (vehiclesState.loading) return;
    setVehiclesState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetchVehicles({ page: pageToLoad, per_page: 10, status: 'active' });
      const newItems = res.data || [];
      const total = res.total || newItems.length;
      
      setVehiclesState(prev => ({
        items: pageToLoad === 1 ? newItems : [...prev.items, ...newItems],
        total,
        page: pageToLoad,
        loading: false
      }));
    } catch (e) {
      setVehiclesState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadShiftsPage = async (pageToLoad = 1) => {
    if (shiftsState.loading) return;
    setShiftsState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetchShifts({ page: pageToLoad, per_page: 10, status: 'active' });
      const newItems = res.data || [];
      const total = res.total || newItems.length;
      
      setShiftsState(prev => ({
        items: pageToLoad === 1 ? newItems : [...prev.items, ...newItems],
        total,
        page: pageToLoad,
        loading: false
      }));
    } catch (e) {
      setShiftsState(prev => ({ ...prev, loading: false }));
    }
  };

  const onDriversShow = () => { if (driversState.items.length === 0) loadDriversPage(1); };
  const onVehiclesShow = () => { if (vehiclesState.items.length === 0) loadVehiclesPage(1); };
  const onShiftsShow = () => { if (shiftsState.items.length === 0) loadShiftsPage(1); };

  const ObserverItem = ({ onVisible }) => {
    const ref = useRef(null);
    useEffect(() => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          onVisible();
        }
      });
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, [onVisible]);
    return (
      <div ref={ref} style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <i className="pi pi-spin pi-spinner" style={{ marginRight: '0.5rem' }} />
        Cargando más...
      </div>
    );
  };

  const driverValueTemplate = (option, props) => {
    if (option && !option.isLoader) return <div>{option.name}</div>;
    if (form.selectedDriver) return <div>{form.selectedDriver.name}</div>;
    return <span>{props.placeholder}</span>;
  };
  const driverItemTemplate = (option) => {
    if (!option) return null;
    if (option.isLoader) return <ObserverItem onVisible={() => loadDriversPage(driversState.page + 1)} />;
    return <div>{option.name}</div>;
  };

  const vehicleValueTemplate = (option, props) => {
    if (option && !option.isLoader) return <div>{option.brand} {option.model} - {option.plate}</div>;
    if (form.selectedVehicle) return <div>{form.selectedVehicle.brand} {form.selectedVehicle.model} - {form.selectedVehicle.plate}</div>;
    return <span>{props.placeholder}</span>;
  };
  const vehicleItemTemplate = (option) => {
    if (!option) return null;
    if (option.isLoader) return <ObserverItem onVisible={() => loadVehiclesPage(vehiclesState.page + 1)} />;
    return <div>{option.brand} {option.model} - {option.plate}</div>;
  };

  const shiftValueTemplate = (option, props) => {
    if (option && !option.isLoader) return <div>{option.name} ({option.start_time?.slice(0,5)} - {option.end_time?.slice(0,5)})</div>;
    if (form.selectedShift) return <div>{form.selectedShift.name} ({form.selectedShift.start_time?.slice(0,5)} - {form.selectedShift.end_time?.slice(0,5)})</div>;
    return <span>{props.placeholder}</span>;
  };
  const shiftItemTemplate = (option) => {
    if (!option) return null;
    if (option.isLoader) return <ObserverItem onVisible={() => loadShiftsPage(shiftsState.page + 1)} />;
    return <div>{option.name} ({option.start_time?.slice(0,5)} - {option.end_time?.slice(0,5)})</div>;
  };

  const driversOptions = driversState.items.length < driversState.total 
    ? [...driversState.items, { id: 'loader', isLoader: true }] 
    : driversState.items;

  const vehiclesOptions = vehiclesState.items.length < vehiclesState.total 
    ? [...vehiclesState.items, { id: 'loader', isLoader: true }] 
    : vehiclesState.items;

  const shiftsOptions = shiftsState.items.length < shiftsState.total 
    ? [...shiftsState.items, { id: 'loader', isLoader: true }] 
    : shiftsState.items;

  const openCreate = async () => {
    setForm(EMPTY_FORM);
    setCreating(true);
  };

  const openEdit = async (profile) => {
    setForm({
      id: profile.id,
      user_id: profile.user_id,
      vehicle_id: profile.vehicle_id,
      shift_id: profile.shift_id,
      is_active: profile.is_active,
      selectedDriver: profile.user,
      selectedVehicle: profile.vehicle,
      selectedShift: profile.shift
    });
    setEditing(true);
  };

  const openView = (profile) => {
    setSelected(profile);
    setViewing(true);
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(false);
    setViewing(false);
    setForm(EMPTY_FORM);
    setSelected(null);
  };

  const handleSave = async () => {
    if (!form.user_id || !form.vehicle_id || !form.shift_id) {
      toast.current?.show({ severity: 'warn', summary: 'Datos incompletos', detail: 'Por favor selecciona Conductor, Vehículo y Horario.' });
      return;
    }

    setLoading(true);
    try {
      if (editing) {
        await updateDriverProfile(form.id, {
          shift_id: form.shift_id,
          vehicle_id: form.vehicle_id,
          is_active: form.is_active
        });
        toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Asignación actualizada correctamente.' });
      } else {
        await createDriverProfile(form);
        toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Asignación creada correctamente.' });
      }
      closeForm();
      loadData();
    } catch (err) {
      console.error('Error guardando asignación:', err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la asignación (Revisa que el conductor no tenga ya una).' });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (profile) => {
    setDeleteConfirm(profile);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      await deleteDriverProfile(deleteConfirm.id);
      toast.current?.show({ severity: 'success', summary: 'Eliminada', detail: 'Asignación eliminada correctamente.' });
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      console.error('Error eliminando asignación:', err);
      toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la asignación.' });
    } finally {
      setLoading(false);
    }
  };

  const driverBody = (rowData) => {
    return rowData.user ? rowData.user.name : 'Desconocido';
  };

  const vehicleBody = (rowData) => {
    return rowData.vehicle ? `${rowData.vehicle.brand} ${rowData.vehicle.model} (${rowData.vehicle.plate})` : 'Sin Vehículo';
  };

  const shiftBody = (rowData) => {
    return rowData.shift ? `${rowData.shift.name} (${rowData.shift.start_time.slice(0,5)} - ${rowData.shift.end_time.slice(0,5)})` : 'Sin Horario';
  };

  const statusBody = (rowData) => {
    if (rowData.deleted_at) {
      return <span className="status-badge status-danger">Eliminado</span>;
    }
    return (
      <span className={`status-badge ${rowData.is_active ? 'status-activo' : 'status-inactivo'}`}>
        {rowData.is_active ? 'Activo' : 'Inactivo'}
      </span>
    );
  };

  const actionBody = (rowData) => (
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      <Button
        icon="pi pi-eye"
        className="p-button-rounded p-button-text p-button-secondary"
        onClick={() => openView(rowData)}
        tooltip="Ver Detalles"
      />
      {!rowData.deleted_at && (
        <>
          <Button
            icon="pi pi-pencil"
            className="p-button-rounded p-button-text p-button-info"
            onClick={() => openEdit(rowData)}
            tooltip="Editar asignación"
          />
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => confirmDelete(rowData)}
            tooltip="Eliminar asignación"
          />
        </>
      )}
    </div>
  );

  return (
    <div className="management-section">
      <Toast ref={toast} />
      <ManagementPageHeader
        title="Asignaciones Activas"
        subtitle="Asigna un vehículo y un horario a cada conductor"
        icon="pi pi-sitemap"
        buttonLabel="Nueva Asignación"
        onButtonClick={openCreate}
      />

      <div className="dashboard-grid-premium">
        <StatCardPremium title="Total Asignaciones" value={globalStats.total} icon="pi pi-link" tone="blue" subtitle="Registradas en sistema" loading={loading} />
        <StatCardPremium title="Inactivas" value={globalStats.inactive} icon="pi pi-pause" tone="amber" subtitle="En el sistema" loading={loading} />
        <StatCardPremium title="Eliminadas" value={globalStats.deleted} icon="pi pi-trash" tone="red" subtitle="En el sistema" loading={loading} />
      </div>

        <CustomDataTable
          value={profiles}
          loading={loading}
          page={page}
          totalRecords={totalRecords}
          rows={rows}
          onPageChange={setPage}
          title="Asignaciones"
          columns={[
            { field: 'id', header: 'ID' },
            { header: 'Conductor', body: driverBody },
            { header: 'Vehículo Asignado', body: vehicleBody },
            { header: 'Horario (Turno)', body: shiftBody },
            { header: 'Estado', body: statusBody },
            { body: actionBody }
          ]}
        />

      {/* Modal Crear/Editar */}
      <Dialog
        visible={creating || editing}
        style={{ width: '500px' }}
        header={editing ? 'Editar Asignación' : 'Nueva Asignación'}
        modal
        onHide={closeForm}
        footer={
          <div>
            <Button label="Cancelar" icon="pi pi-times" onClick={closeForm} className="p-button-text" />
            <Button label="Guardar" icon="pi pi-save" onClick={handleSave} autoFocus />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="user_id" style={{ display: 'block', marginBottom: '0.5rem' }}>Conductor</label>
            <Dropdown 
              id="user_id" 
              value={form.user_id} 
              options={driversOptions} 
              onChange={(e) => setForm({ ...form, user_id: e.value })} 
              optionLabel="name" 
              optionValue="id"
              placeholder="Selecciona un conductor"
              disabled={editing}
              onShow={onDriversShow}
              itemTemplate={driverItemTemplate}
              valueTemplate={driverValueTemplate}
            />
          </div>
          
          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="vehicle_id" style={{ display: 'block', marginBottom: '0.5rem' }}>Vehículo (Carrito)</label>
            <Dropdown 
              id="vehicle_id" 
              value={form.vehicle_id} 
              options={vehiclesOptions} 
              onChange={(e) => setForm({ ...form, vehicle_id: e.value })} 
              optionLabel="brand"
              optionValue="id"
              placeholder="Selecciona el vehículo a asignar" 
              onShow={onVehiclesShow}
              itemTemplate={vehicleItemTemplate}
              valueTemplate={vehicleValueTemplate}
            />
          </div>

          <div className="p-field" style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="shift_id" style={{ display: 'block', marginBottom: '0.5rem' }}>Horario (Turno)</label>
            <Dropdown 
              id="shift_id" 
              value={form.shift_id} 
              options={shiftsOptions} 
              onChange={(e) => setForm({ ...form, shift_id: e.value })} 
              optionLabel="name"
              optionValue="id"
              placeholder="Selecciona el turno de trabajo" 
              onShow={onShiftsShow}
              itemTemplate={shiftItemTemplate}
              valueTemplate={shiftValueTemplate}
            />
          </div>
          {editing && (
            <div className="p-field" style={{ display: 'flex', alignItems: 'center', marginTop: '1.5rem' }}>
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
      </Dialog>

      {/* Modal Ver Detalles */}
      <DetailModal
        header="Detalles de Asignación"
        visible={viewing}
        onHide={closeForm}
        icon="pi pi-sitemap"
        title={`Asignación #${selected?.id}`}
        subtitle={selected?.user ? selected.user.name : 'Conductor desconocido'}
      >
        {selected && (
          <>
            <DetailField icon="pi pi-car" label="Vehículo">
              {selected.vehicle ? `${selected.vehicle.brand} ${selected.vehicle.model} - ${selected.vehicle.plate}` : 'Desconocido'}
            </DetailField>
            <DetailField icon="pi pi-clock" label="Horario">
              {selected.shift ? `${selected.shift.name} (${selected.shift.start_time?.slice(0,5)} - ${selected.shift.end_time?.slice(0,5)})` : 'Desconocido'}
            </DetailField>
            <DetailField icon="pi pi-info-circle" label="Estado">
              {selected.deleted_at ? (
                <span className="status-badge status-inactivo" style={{ backgroundColor: '#e57373', color: '#fff' }}>Eliminado</span>
              ) : selected.is_active ? (
                <span className="status-badge status-activo">Activo</span>
              ) : (
                <span className="status-badge status-inactivo">Inactivo</span>
              )}
            </DetailField>
          </>
        )}
      </DetailModal>

      {/* Modal Confirmar Eliminación */}
      <Dialog
        visible={!!deleteConfirm}
        style={{ width: '450px' }}
        header="Confirmar Eliminación"
        modal
        onHide={() => setDeleteConfirm(null)}
        footer={
          <div>
            <Button label="No" icon="pi pi-times" onClick={() => setDeleteConfirm(null)} className="p-button-text" />
            <Button label="Sí, Eliminar" icon="pi pi-check" onClick={handleDelete} className="p-button-danger" autoFocus />
          </div>
        }
      >
        <div className="confirmation-content" style={{ display: 'flex', alignItems: 'center' }}>
          <i className="pi pi-exclamation-triangle" style={{ fontSize: '2rem', color: 'var(--danger-main)', marginRight: '1rem' }} />
          {deleteConfirm && <span>¿Estás seguro de que deseas eliminar la asignación de <b>{deleteConfirm.user?.name}</b>?</span>}
        </div>
      </Dialog>
    </div>
  );
}

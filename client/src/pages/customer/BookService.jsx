import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { addressApi, bookingApi, serviceApi } from '../../api/endpoints';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { useApi } from '../../hooks/useApi';
import { useArea } from '../../context/AreaContext';
import { TIME_SLOTS } from '../../config/site';
import { Field } from '../../components/FormFields';
import ApplianceIcon from '../../components/ApplianceIcon';
import { ErrorBox, Notice, SectionCard, Spinner, SubmitButton } from '../../components/ui';
import { addDaysISO, addressLine, formatINR, todayISO } from '../../utils/format';
import { normalizePhone, rules, validateFields } from '../../utils/validators';

const NEW = 'new'; // addressId value meaning "type a new address on this page"
const NEW_ADDRESS_SCHEMA = { city: rules.required('Area / City'), line1: rules.required('Village / Locality'), pincode: rules.pincode, contactPhone: rules.optionalPhone };

export default function BookService() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const services = useApi(() => serviceApi.list(), []);
  const addresses = useApi(() => addressApi.list(), []);
  const { area, areas } = useArea();
  const [addr, setAddr] = useState({ city: area, line1: '', line2: '', landmark: '', pincode: '', contactPhone: '' });
  const [form, setForm] = useState({ serviceId: '', addressId: '', scheduledDate: todayISO(), timeSlot: TIME_SLOTS[0].value, issueDescription: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const list = services.data?.services || [];
  const addrList = addresses.data?.addresses || [];

  // Pre-select service from ?service=slug and the default address.
  useEffect(() => {
    const slug = params.get('service');
    const match = list.find((s) => s.slug === slug);
    if (match) setForm((f) => (f.serviceId ? f : { ...f, serviceId: match._id }));
  }, [list, params]);
  useEffect(() => {
    if (addresses.loading) return;
    const def = addrList.find((a) => a.isDefault) || addrList[0];
    setForm((f) => (f.addressId ? f : { ...f, addressId: def ? def._id : NEW }));
  }, [addrList, addresses.loading]);

  const chosen = list.find((s) => s._id === form.serviceId);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setA = (k) => (e) => setAddr((a) => ({ ...a, [k]: e.target.value }));
  const isNew = form.addressId === NEW;

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.serviceId) errs.serviceId = 'Choose a service';
    if (!form.addressId) errs.addressId = 'Choose an address';
    if (isNew) Object.assign(errs, validateFields(addr, NEW_ADDRESS_SCHEMA));
    if (!form.scheduledDate || form.scheduledDate < todayISO() || form.scheduledDate > addDaysISO(30)) errs.scheduledDate = 'Choose a date within the next 30 days';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    setServerError('');
    try {
      let addressId = form.addressId;
      if (isNew) {
        const { data } = await addressApi.create({
          label: 'Home',
          line1: addr.line1.trim(),
          line2: addr.line2.trim(),
          landmark: addr.landmark.trim(),
          city: addr.city,
          district: 'Purulia',
          state: 'West Bengal',
          pincode: addr.pincode.trim(),
          contactPhone: addr.contactPhone ? normalizePhone(addr.contactPhone) : '',
        });
        addressId = data.address._id;
        // Saved now: if the booking step fails, a retry reuses this address instead of saving it twice.
        setForm((f) => ({ ...f, addressId }));
        addresses.reload();
      }
      const { data } = await bookingApi.create({ ...form, addressId, issueDescription: form.issueDescription.trim() });
      navigate('/my-bookings', { state: { message: `Booking #${data.booking.bookingNo} created. We will assign a technician soon.` } });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (services.loading || addresses.loading) return <Spinner />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Book a Service</h1>
          <p>Pick a service, address and time slot</p>
        </div>
      </div>
      <ErrorBox message={services.error || addresses.error} onRetry={() => { services.reload(); addresses.reload(); }} />
      <div className="row g-3">
        <div className="col-lg-8">
          <SectionCard title="Booking Details">
            <Notice type="danger" message={serverError} />
            <form onSubmit={submit} noValidate>
              <Field id="b-service" as="select" label="Service" value={form.serviceId} onChange={set('serviceId')} error={errors.serviceId}>
                <option value="">Select a service</option>
                {list.map((s) => <option key={s._id} value={s._id}>{s.name} — from {formatINR(s.startingPrice)}</option>)}
              </Field>
              <Field id="b-address" as="select" label="Service Address" value={form.addressId} onChange={set('addressId')} error={errors.addressId}>
                {addrList.map((a) => <option key={a._id} value={a._id}>{a.label}: {addressLine(a)}</option>)}
                <option value={NEW}>+ Add a new address</option>
              </Field>
              {isNew && (
                <div className="border rounded-3 p-3 mb-3">
                  <div className="row">
                    <Field id="na-city" as="select" label="Area / City" className="col-md-6 mb-3" value={addr.city} onChange={setA('city')} error={errors.city}>
                      {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                    </Field>
                    <Field id="na-l1" label="Village / Locality" className="col-md-6 mb-3" maxLength={120} placeholder="e.g. Sindri" value={addr.line1} onChange={setA('line1')} error={errors.line1} />
                  </div>
                  <Field id="na-l2" label="House no. / Para / Street (optional)" maxLength={120} placeholder="e.g. House 12, Mondal Para" value={addr.line2} onChange={setA('line2')} error={errors.line2} />
                  <div className="row">
                    <Field id="na-lm" label="Landmark (optional)" className="col-md-6 mb-3" maxLength={80} placeholder="e.g. Near primary school" value={addr.landmark} onChange={setA('landmark')} error={errors.landmark} />
                    <Field id="na-pin" label="PIN Code" className="col-md-6 mb-3" inputMode="numeric" maxLength={6} value={addr.pincode} onChange={setA('pincode')} error={errors.pincode} />
                  </div>
                  <Field id="na-phone" label="Contact phone at this address (optional)" className="mb-0" type="tel" maxLength={14} value={addr.contactPhone} onChange={setA('contactPhone')} error={errors.contactPhone} />
                  <p className="small-xs text-muted-qf mt-2 mb-0">This address is saved to your account for next time. Manage it under <Link to="/my-addresses">Addresses</Link>.</p>
                </div>
              )}
              <div className="row">
                <Field id="b-date" type="date" label="Preferred Date" className="col-md-6 mb-3" min={todayISO()} max={addDaysISO(30)} value={form.scheduledDate} onChange={set('scheduledDate')} error={errors.scheduledDate} />
                <Field id="b-slot" as="select" label="Time Slot" className="col-md-6 mb-3" value={form.timeSlot} onChange={set('timeSlot')} error={errors.timeSlot}>
                  {TIME_SLOTS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Field>
              </div>
              <Field id="b-issue" as="textarea" rows={3} maxLength={500} label="Describe the problem (optional)" placeholder="e.g. AC is running but not cooling" value={form.issueDescription} onChange={set('issueDescription')} error={errors.issueDescription} />
              <SubmitButton loading={saving} className="btn btn-teal" disabled={saving}>Confirm Booking</SubmitButton>
            </form>
          </SectionCard>
        </div>
        <div className="col-lg-4">
          <div className="qf-card qf-card-body">
            <h2 className="qf-card-title mb-3">Summary</h2>
            {chosen ? (
              <>
                <div className="d-flex gap-3 align-items-center mb-3">
                  <span className="thumb" style={{ width: 64, height: 64 }}><ApplianceIcon slug={chosen.slug} size={48} /></span>
                  <div>
                    <strong className="d-block text-navy">{chosen.name}</strong>
                    <span className="small text-muted-qf">Inspection from {formatINR(chosen.startingPrice)}</span>
                  </div>
                </div>
                <p className="small-xs text-muted-qf mb-0">The technician will inspect and send a quotation. You pay only after you accept it and the job is done.</p>
              </>
            ) : (
              <p className="small text-muted-qf mb-0">Choose a service to see its starting price.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

import { useState } from 'react';
import { userApi } from '../../api/endpoints';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Field } from '../../components/FormFields';
import { Notice, SectionCard, SubmitButton } from '../../components/ui';
import { formatDate, initials } from '../../utils/format';
import { rules, validateFields } from '../../utils/validators';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.fullName);
  const [nameMsg, setNameMsg] = useState({ type: '', text: '' });
  const [savingName, setSavingName] = useState(false);

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [savingPw, setSavingPw] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    const err = rules.fullName(name);
    if (err) return setNameMsg({ type: 'danger', text: err });
    setSavingName(true);
    try {
      const { data } = await userApi.updateMe({ fullName: name.trim() });
      setUser(data.user);
      setNameMsg({ type: 'success', text: 'Profile updated.' });
    } catch (e2) {
      setNameMsg({ type: 'danger', text: getErrorMessage(e2) });
    } finally {
      setSavingName(false);
    }
    return undefined;
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const errs = validateFields(pw, {
      currentPassword: rules.required('Current password'),
      newPassword: rules.password,
      confirm: (v, all) => (v === all.newPassword ? '' : 'Passwords do not match'),
    });
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setSavingPw(true);
    setPwMsg({ type: '', text: '' });
    try {
      const { data } = await userApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMsg({ type: 'success', text: data.message });
    } catch (e2) {
      setPwErrors(getFieldErrors(e2));
      setPwMsg({ type: 'danger', text: getErrorMessage(e2) });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1>My Profile</h1>
          <p>Your account details and password</p>
        </div>
      </div>
      <div className="row g-3">
        <div className="col-lg-4">
          <div className="qf-card qf-card-body text-center">
            <span className="avatar avatar-lg mx-auto mb-2" style={{ width: 80, height: 80, fontSize: '1.6rem' }}>{initials(user.fullName)}</span>
            <h2 className="h5 mb-0">{user.fullName}</h2>
            <p className="small text-muted-qf text-capitalize mb-3">{user.role}</p>
            <ul className="list-unstyled text-start small mb-0">
              <li className="mb-2"><i className="bi bi-telephone text-teal me-2" />+91 {user.phone}</li>
              <li className="mb-2 text-break"><i className="bi bi-envelope text-teal me-2" />{user.email}</li>
              <li><i className="bi bi-calendar3 text-teal me-2" />Member since {formatDate(user.createdAt)}</li>
            </ul>
          </div>
        </div>
        <div className="col-lg-8 d-flex flex-column gap-3">
          <SectionCard title="Edit Profile">
            <Notice type={nameMsg.type} message={nameMsg.text} onClose={() => setNameMsg({ type: '', text: '' })} />
            <form onSubmit={saveName} noValidate>
              <div className="row">
                <Field id="p-name" label="Full Name" className="col-md-6 mb-3" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
                <Field id="p-phone" label="Phone Number" className="col-md-6 mb-3" value={`+91 ${user.phone}`} disabled readOnly />
                <Field id="p-email" label="Email" className="col-md-6 mb-3" value={user.email} disabled readOnly />
              </div>
              <p className="small-xs text-muted-qf">Phone and email are verified identities. To change them, contact support so we can re-verify.</p>
              <SubmitButton loading={savingName} className="btn btn-teal">Save Changes</SubmitButton>
            </form>
          </SectionCard>
          <SectionCard title="Change Password">
            <Notice type={pwMsg.type} message={pwMsg.text} onClose={() => setPwMsg({ type: '', text: '' })} />
            <form onSubmit={savePassword} noValidate>
              <div className="row">
                <Field id="pw-cur" type="password" label="Current Password" className="col-md-4 mb-3" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={pwErrors.currentPassword} />
                <Field id="pw-new" type="password" label="New Password" className="col-md-4 mb-3" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} error={pwErrors.newPassword} />
                <Field id="pw-conf" type="password" label="Confirm New Password" className="col-md-4 mb-3" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} error={pwErrors.confirm} />
              </div>
              <p className="small-xs text-muted-qf">Changing your password signs you out on all other devices.</p>
              <SubmitButton loading={savingPw} className="btn btn-navy">Update Password</SubmitButton>
            </form>
          </SectionCard>
        </div>
      </div>
    </>
  );
}

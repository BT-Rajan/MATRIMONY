import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { useI18n } from '../../i18n';
import { fmtDateTime } from '../../date';

const SOURCES = ['porur', 'trichy', 'mayiladuthurai', 'others'];
const SALUTATIONS = ['Mr', 'Ms.'];
const SORTS = ['created_at', 'updated_at', 'lead_no', 'name', 'source', 'phone1'];
const BLANK = { salutation: 'Mr', source: 'porur', source_id: '', name: '', phone1: '', phone2: '', comment: '' };

export default function Leads() {
  const { t } = useI18n();
  const [sp, setSp] = useSearchParams();
  const source = sp.get('source') || '';
  const q = sp.get('q') || '';
  const sort = SORTS.includes(sp.get('sort')) ? sp.get('sort') : 'created_at';
  const dir = sp.get('dir') === 'asc' ? 'asc' : 'desc';
  const page = Math.max(1, Number(sp.get('page')) || 1);

  const [qi, setQi] = useState(q);
  const [tick, setTick] = useState(0);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [form, setForm] = useState(null); // null = closed; {id?, ...fields}
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const firstRef = useRef(null);
  const [showImport, setShowImport] = useState(false);
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importErr, setImportErr] = useState('');
  const [importErrs, setImportErrs] = useState({});

  const load = useCallback(() => {
    setErr('');
    const qs = new URLSearchParams({ source, q, sort, dir, page: String(page) }).toString();
    return api.get(`leads?${qs}`).then(setData).catch((e) => setErr(e.code));
  }, [source, q, sort, dir, page]);

  useEffect(() => { setData(null); load(); }, [load, tick]);
  useEffect(() => { setQi(q); }, [q]);
  useEffect(() => { if (form) firstRef.current?.focus(); }, [form]);

  const go = (next) => {
    const p = {};
    const merged = { source, q, sort, dir, page: String(page), ...next };
    for (const [k, v] of Object.entries(merged)) if (v && !(k === 'page' && v === '1')) p[k] = v;
    setSp(p);
  };
  const search = (e) => { e.preventDefault(); go({ q: qi.trim(), page: '1' }); };
  const hasFilters = !!(source || q);
  const clearFilters = () => { setQi(''); setSp({}); };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.per)) : 1;

  const openNew = () => { setErrs({}); setErr(''); setNotice(''); setForm({ ...BLANK }); };
  const openEdit = (l) => {
    setErrs({}); setErr(''); setNotice('');
    setForm({
      id: l.id, salutation: l.salutation, source: l.source, source_id: l.source_id || '',
      name: l.name, phone1: l.phone1, phone2: l.phone2 || '', comment: l.comment || '',
    });
  };
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    setErrs({}); setErr(''); setNotice(''); setBusy(true);
    try {
      const { id, ...body } = form;
      if (id) await api.put(`leads/${id}`, body);
      else await api.post('leads', body);
      setForm(null);
      setNotice(t('l_saved'));
      setTick((n) => n + 1);
    } catch (x) {
      if (x.errors && Object.keys(x.errors).length) setErrs(x.errors);
      else setErr(x.code);
    } finally {
      setBusy(false);
    }
  }

  async function remove(l) {
    if (!window.confirm(`${t('l_delete_confirm')} ${l.lead_no} — ${l.name}`)) return;
    setErr(''); setNotice('');
    try {
      await api.del(`leads/${l.id}`);
      setTick((n) => n + 1);
    } catch (x) {
      setErr(x.code);
    }
  }

  const downloadTemplate = () => {
    const csv = 'salutation,source,source_id,name,phone1,phone2,comment\r\nMr,porur,REF-001,Ravi Kumar,9876543210,,Called once\r\n';
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  async function importCsv(e) {
    e.preventDefault();
    if (!file) return;
    setImportErr(''); setImportErrs({}); setNotice('');
    if (file.size > 1024 * 1024) { setImportErr('too_large'); return; }
    setImporting(true);
    try {
      const csv = await file.text();
      const r = await api.post('leads/import', { csv });
      setNotice(t('l_import_done', { n: String(r.inserted) }));
      setFile(null);
      setFileKey((n) => n + 1);
      setShowImport(false);
      setTick((n) => n + 1);
    } catch (x) {
      setImportErr(x.code);
      setImportErrs(x.errors || {});
    } finally {
      setImporting(false);
    }
  }

  const fieldErr = (k) => (errs[k] ? <span className="field-err" role="alert">{t('e_' + errs[k])}</span> : null);

  return (
    <>
      <div className="page-head">
        <h1>{t('l_title')}</h1>
        {!form && (
          <div className="row">
            <button type="button" className="btn secondary" aria-expanded={showImport} onClick={() => { setShowImport((v) => !v); setImportErr(''); setImportErrs({}); }}>{t('l_import')}</button>
            <button type="button" className="btn" onClick={openNew}>{t('l_add')}</button>
          </div>
        )}
      </div>

      {notice && <div className="alert ok" role="status">{notice}</div>}
      {err && <div className="alert bad" role="alert">{t('e_' + err)}</div>}

      {showImport && !form && (
        <section className="card" aria-labelledby="imp">
          <h2 id="imp">{t('l_import')}</h2>
          <p className="hint">{t('l_import_help')}</p>
          <form onSubmit={importCsv} noValidate>
            <div className="field">
              <label htmlFor="l-csv">{t('l_import_pick')}</label>
              <input key={fileKey} id="l-csv" type="file" accept=".csv,text/csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            {importErr && (
              <div className="alert bad" role="alert">
                {t('e_' + importErr)}
                {Object.keys(importErrs).length > 0 && (
                  <ul className="plain-list mt-6">
                    {Object.entries(importErrs).slice(0, 20).map(([k, v]) => <li key={k}>{k}: {t('e_' + v)}</li>)}
                    {Object.keys(importErrs).length > 20 && <li>…</li>}
                  </ul>
                )}
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="btn" disabled={!file || importing}>{importing ? t('loading') : t('l_import_go')}</button>
              <button type="button" className="btn secondary" onClick={downloadTemplate}>{t('l_import_template')}</button>
              <button type="button" className="btn secondary" onClick={() => setShowImport(false)}>{t('l_cancel')}</button>
            </div>
          </form>
        </section>
      )}

      {form && (
        <form className="card lead-form" onSubmit={submit} noValidate>
          <div className="grid">
            <div className="field">
              <label htmlFor="l-sal">{t('l_salutation')}</label>
              <select id="l-sal" value={form.salutation} onChange={(e) => set('salutation', e.target.value)} ref={firstRef}>
                {SALUTATIONS.map((s) => <option key={s} value={s}>{t('sal_' + s)}</option>)}
              </select>
              {fieldErr('salutation')}
            </div>
            <div className="field">
              <label htmlFor="l-name">{t('l_name')}</label>
              <input id="l-name" type="text" maxLength={120} value={form.name} onChange={(e) => set('name', e.target.value)} />
              {fieldErr('name')}
            </div>
            <div className="field">
              <label htmlFor="l-src">{t('l_source')}</label>
              <select id="l-src" value={form.source} onChange={(e) => set('source', e.target.value)}>
                {SOURCES.map((s) => <option key={s} value={s}>{t('src_' + s)}</option>)}
              </select>
              {fieldErr('source')}
            </div>
            <div className="field">
              <label htmlFor="l-srcid">{t('l_source_id')}</label>
              <input id="l-srcid" type="text" maxLength={60} value={form.source_id} onChange={(e) => set('source_id', e.target.value)} />
              {fieldErr('source_id')}
            </div>
            <div className="field">
              <label htmlFor="l-p1">{t('l_phone1')}</label>
              <input id="l-p1" type="tel" maxLength={20} value={form.phone1} onChange={(e) => set('phone1', e.target.value)} />
              {fieldErr('phone1')}
            </div>
            <div className="field">
              <label htmlFor="l-p2">{t('l_phone2')}</label>
              <input id="l-p2" type="tel" maxLength={20} value={form.phone2} onChange={(e) => set('phone2', e.target.value)} />
              {fieldErr('phone2')}
            </div>
          </div>
          <div className="field">
            <label htmlFor="l-cmt">{t('l_comment')}</label>
            <textarea id="l-cmt" rows={3} maxLength={2000} value={form.comment} onChange={(e) => set('comment', e.target.value)} />
            {fieldErr('comment')}
          </div>
          <div className="form-actions">
            <button type="submit" className="btn" disabled={busy}>{t('l_save')}</button>
            <button type="button" className="btn secondary" onClick={() => setForm(null)}>{t('l_cancel')}</button>
          </div>
        </form>
      )}

      <form className="toolbar wide" onSubmit={search} role="search">
        <div className="field">
          <label htmlFor="l-q">{t('search')}</label>
          <input id="l-q" type="text" value={qi} onChange={(e) => setQi(e.target.value)} placeholder={t('l_search_ph')} maxLength={60} />
        </div>
        <div className="field">
          <label htmlFor="l-f-src">{t('l_source')}</label>
          <select id="l-f-src" value={source} onChange={(e) => go({ source: e.target.value, page: '1' })}>
            <option value="">{t('l_all_sources')}</option>
            {SOURCES.map((s) => <option key={s} value={s}>{t('src_' + s)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="l-sort">{t('l_sort')}</label>
          <select id="l-sort" value={sort} onChange={(e) => go({ sort: e.target.value, page: '1' })}>
            {SORTS.map((s) => <option key={s} value={s}>{t('sort_' + s)}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="l-dir">{t('l_dir')}</label>
          <select id="l-dir" value={dir} onChange={(e) => go({ dir: e.target.value, page: '1' })}>
            <option value="desc">{t('l_desc')}</option>
            <option value="asc">{t('l_asc')}</option>
          </select>
        </div>
        <button className="btn" type="submit">{t('search')}</button>
      </form>
      {hasFilters && <p className="mt-6"><button type="button" className="btn secondary small" onClick={clearFilters}>{t('a_clear')}</button></p>}

      {!data && !err && <p role="status">{t('loading')}</p>}
      {data && (data.items.length === 0 ? <p>{t('l_none')}</p> : (
        <>
          <p className="hint">{t('l_total', { n: data.total })}</p>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th scope="col">{t('l_no')}</th>
                  <th scope="col">{t('l_salutation')}</th>
                  <th scope="col">{t('l_name')}</th>
                  <th scope="col">{t('l_source')}</th>
                  <th scope="col">{t('l_source_id')}</th>
                  <th scope="col">{t('l_phone1')}</th>
                  <th scope="col">{t('l_phone2')}</th>
                  <th scope="col">{t('l_created')}</th>
                  <th scope="col">{t('l_actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((l) => (
                  <tr key={l.id}>
                    <td data-label={t('l_no')}>{l.lead_no}</td>
                    <td data-label={t('l_salutation')}>{t('sal_' + l.salutation)}</td>
                    <td data-label={t('l_name')}>{l.name}</td>
                    <td data-label={t('l_source')}>{t('src_' + l.source)}</td>
                    <td data-label={t('l_source_id')}>{l.source_id || '—'}</td>
                    <td data-label={t('l_phone1')}><a href={`tel:${l.phone1}`}>{l.phone1}</a></td>
                    <td data-label={t('l_phone2')}>{l.phone2 ? <a href={`tel:${l.phone2}`}>{l.phone2}</a> : '—'}</td>
                    <td data-label={t('l_created')}>{fmtDateTime(l.created_at)}{l.created_by_name ? ` · ${l.created_by_name}` : ''}</td>
                    <td data-label={t('l_actions')}>
                      <button type="button" className="btn secondary small" onClick={() => openEdit(l)}>{t('l_edit')}</button>{' '}
                      <button type="button" className="btn danger small" onClick={() => remove(l)}>{t('l_delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <nav className="pager" aria-label="Pagination">
            <button type="button" className="btn secondary small" disabled={page <= 1} onClick={() => go({ page: String(page - 1) })}>{t('prev')}</button>
            <span>{t('page_of', { p: page, n: pages })}</span>
            <button type="button" className="btn secondary small" disabled={page >= pages} onClick={() => go({ page: String(page + 1) })}>{t('next')}</button>
          </nav>
        </>
      ))}
    </>
  );
}

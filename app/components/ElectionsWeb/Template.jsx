import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from '@remix-run/react';
import {
  createWhatsAppTemplate,
  getWhatsAppTemplates,
  deleteWhatsAppTemplate,
  updateWhatsAppTemplate,
  uploadTemplateMedia

} from '~/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, Eye, Save, X, Loader2, ArrowRight,
  ChevronDown, ChevronUp, Copy, Check, Edit, ArrowLeft
} from 'lucide-react';

export default function TemplateManager() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [openCreate, setOpenCreate] = useState(false);
  const [openSample, setOpenSample] = useState(false);
  const [preview, setPreview] = useState({});
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [category, setCategory] = useState('MARKETING');
  const [language, setLanguage] = useState('');
  const [integratedNumber] = useState('917997993374');

  // Header
  const [headerFormat, setHeaderFormat] = useState('NONE');
  const [headerText, setHeaderText] = useState('');
  const [headerExample, setHeaderExample] = useState([]);
  const [mediaType, setMediaType] = useState('IMAGE'); // IMAGE, VIDEO, DOCUMENT
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Body
  const [bodyText, setBodyText] = useState('');
  const [bodyVariables, setBodyVariables] = useState(0);
  const [bodyExamples, setBodyExamples] = useState([]);

  // Footer
  const [footerText, setFooterText] = useState('');

  const BODY_CHAR_LIMIT = 1024;
  const TEMPLATE_NAME_REGEX = /^[a-z_]+$/;

  // Buttons
  const [buttons, setButtons] = useState([]);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Add variable to body
  const addBodyVariable = () => {
    const next = bodyVariables + 1;
    setBodyVariables(next);
    setBodyText(prev => `${prev}{{${next}}}`);
    setBodyExamples(prev => {
      const newEx = prev[0] ? [...prev] : [[]];
      newEx[0].push('');
      return newEx;
    });
  };

  // Add button
  const addButton = () => {
    setButtons(prev => [...prev, { text: '' }]);
  };

  const updateButton = (index, value) => {
    const newButtons = [...buttons];
    newButtons[index].text = value;
    setButtons(newButtons);
  };

  const removeButton = (index) => {
    setButtons(prev => prev.filter((_, i) => i !== index));
  };

  // Build components for API
  const buildComponents = () => {
    const comps = [];

    // HEADER
    if (headerFormat === 'TEXT' && headerText.trim()) {
      const example = headerExample.length > 0 && headerExample.some(e => e.trim())
        ? { header_text: headerExample.filter(e => e.trim()) }
        : undefined;

      comps.push({
        type: 'HEADER',
        format: 'TEXT',
        text: headerText,
        example,
      });
    } else if (headerFormat === 'MEDIA' && mediaUrl) {
      comps.push({
        type: 'HEADER',
        format: mediaType,
        example: {
          header_handle: [mediaUrl]
        }
      });
    }

    // BODY
    if (bodyText.trim()) {
      let example = undefined;
      if (bodyVariables > 0 && bodyExamples[0]?.length === bodyVariables) {
        const values = bodyExamples[0].filter(v => v?.trim());
        if (values.length === bodyVariables) {
          example = { body_text: [values] };
        }
      }
      comps.push({ type: 'BODY', text: bodyText, example });
    }

    // FOOTER
    if (footerText.trim()) {
      comps.push({ type: 'FOOTER', text: footerText });
    }

    // BUTTONS
    if (buttons.length > 0 && buttons.some(b => b.text.trim())) {
      comps.push({
        type: 'BUTTONS',
        buttons: buttons
          .filter(b => b.text.trim())
          .map(b => ({ type: 'QUICK_REPLY', text: b.text })),
      });
    }

    return comps;
  };



  const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000); // Reset after 3 seconds
    };

    return (
      <button
        onClick={handleCopy}
        className={`transition-colors ${copied ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
        title={copied ? 'Copied!' : 'Copy name'}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    );
  };
  // Live Preview
  useEffect(() => {
    const comps = buildComponents();
    const previewObj = {};
    comps.forEach(c => {
      if (c.type === 'HEADER') {
        if (c.format === 'TEXT') {
          previewObj.header = c.text.replace(/\{\{\d+\}\}/g, m => `[${m}]`);
        } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(c.format)) {
          previewObj.headerMedia = { type: c.format, url: mediaUrl };
        }
      }
      if (c.type === 'BODY') previewObj.body = c.text.replace(/\{\{\d+\}\}/g, m => `[${m}]`);
      if (c.type === 'FOOTER') previewObj.footer = c.text;
      if (c.type === 'BUTTONS') previewObj.buttons = c.buttons.map(b => b.text);
    });
    setPreview(previewObj);
  }, [headerText, bodyText, footerText, buttons, bodyExamples, mediaUrl, mediaType, headerFormat]);

  // Step 1: Save → Open Sample Modal
  const onFirstSave = () => {
    const newErrors = {};

    if (!templateName.trim()) {
      newErrors.template_name = 'This field is required';
    } else if (!TEMPLATE_NAME_REGEX.test(templateName.trim())) {
      newErrors.template_name = 'The message template name can only have lower-case letters and underscores';
    }

    if (!language) newErrors.language = 'This field is required';

    if (!bodyText.trim()) {
      newErrors.body = 'This field is required';
    } else if (bodyText.length > BODY_CHAR_LIMIT) {
      newErrors.body = `Body cannot exceed ${BODY_CHAR_LIMIT} characters`;
    }

    if (footerText.length > 60) newErrors.footer = 'Footer cannot exceed 60 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please fix the errors');
      return;
    }

    setErrors({});
    setOpenSample(true);
  };

  // Step 2: Final Submit
  const onFinalSubmit = async () => {
    // Validate samples - required for both create and update when variables exist
    const missingSamples = [];
    if (bodyVariables > 0 && bodyExamples[0]?.some(v => !v?.trim())) {
      for (let i = 0; i < bodyVariables; i++) {
        if (!bodyExamples[0][i]?.trim()) missingSamples.push(`{{${i + 1}}}`);
      }
    }
    if (headerFormat === 'TEXT' && headerText.includes('{{1}}') && !headerExample[0]?.trim()) {
      missingSamples.push('Header {{1}}');
    }
    if (headerFormat === 'MEDIA' && !mediaUrl) {
      toast.error('Please upload media for the header');
      return;
    }
    if (missingSamples.length > 0) {
      toast.error(`Sample required for: ${missingSamples.join(', ')}`);
      return;
    }

    if (bodyText.length > BODY_CHAR_LIMIT) {
      const msg = `Body cannot exceed ${BODY_CHAR_LIMIT} characters`;
      toast.error(msg);
      setErrors(prev => ({ ...prev, body: msg }));
      return;
    }

    // Validate footer length
    if (footerText.length > 60) {
      toast.error('Footer cannot exceed 60 characters');
      setErrors(prev => ({ ...prev, footer: 'Footer cannot exceed 60 characters' }));
      return;
    }

    setLoading(true);
    try {
      if (isEditMode && editingTemplateId) {
        // Update existing template
        const payload = {
          integrated_number: integratedNumber,
          components: buildComponents(),
          button_url: false,
        };
        await updateWhatsAppTemplate(editingTemplateId, payload);
        toast.success('Template updated successfully!');
      } else {
        // Create new template
        const payload = {
          integrated_number: integratedNumber,
          template_name: templateName,
          language: language,
          category: category,
          button_url: false,
          components: buildComponents(),
        };
        await createWhatsAppTemplate(payload);
        toast.success('Template created successfully!');
      }
      closeAll();
      fetchTemplates();
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || (isEditMode ? 'Failed to update template' : 'Failed to create template');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Templates (Correct API URL)
  const fetchTemplates = async () => {
    setFetching(true);
    try {
      const response = await getWhatsAppTemplates({
        integratedNumber: integratedNumber,
        skip: 0,
        limit: 100,
      });

      // The API returns { success: true, data: { status: "success", data: [...] } }
      // getWhatsAppTemplates returns response with nested data structure
      const raw = response?.data?.data || [];

      // Flatten the structure - each language variant becomes a separate template entry
      const parsed = [];
      raw.forEach(template => {
        if (template.languages && Array.isArray(template.languages)) {
          template.languages.forEach(lang => {
            parsed.push({
              id: lang.id,
              name: lang.name,
              category: template.category,
              language: lang.language,
              status: lang.status || 'PENDING',
              code: lang.code || [],
              template_id: lang.id,
              is_disabled: lang.is_disabled || 0,
              namespace: template.namespace,
            });
          });
        }
      });

      // Exclude specific templates from UI
      const hiddenTemplateNames = new Set([
        'login_otp',
        'telugu_install_rep_group',
        'app_install_common',
        'app_install_template_te',
        'test_template1',
      ]);

      const visibleTemplates = parsed.filter(t => !hiddenTemplateNames.has(t.name));

      setTemplates(visibleTemplates);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load templates');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("create") === "1") {
      setOpenCreate(true);
    }
  }, [location.search]);

  // Delete Template
  const deleteTemplate = async (integrated_number, template_name) => {
    if (!window.confirm('Delete this template? This action cannot be undone.')) return;
    try {
      await deleteWhatsAppTemplate({ integrated_number, template_name });
      toast.success('Template deleted');
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Delete failed');
    }
  };

  // Load template data into form for editing
  const loadTemplateForEdit = (template) => {
    setTemplateName(template.name);
    setCategory(template.category);
    setLanguage(template.language);
    setEditingTemplateId(template.template_id);
    setIsEditMode(true);

    // Parse components
    const components = template.code || [];
    let headerFound = false;
    let bodyFound = false;
    let footerFound = false;
    let buttonsFound = [];

    components.forEach(comp => {
      if (comp.type === 'HEADER' && comp.format === 'TEXT') {
        setHeaderFormat('TEXT');
        setHeaderText(comp.text || '');
        if (comp.example?.header_text) {
          setHeaderExample(comp.example.header_text);
        }
        headerFound = true;
      } else if (comp.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(comp.format)) {
        setHeaderFormat('MEDIA');
        setMediaType(comp.format);
        if (comp.example?.header_handle && comp.example.header_handle[0]) {
          setMediaUrl(comp.example.header_handle[0]);
        }
        headerFound = true;
      } else if (comp.type === 'BODY') {
        setBodyText(comp.text || '');
        // Count variables in body text
        const matches = (comp.text || '').match(/\{\{\d+\}\}/g);
        if (matches) {
          const maxVar = Math.max(...matches.map(m => parseInt(m.replace(/[{}]/g, ''))));
          setBodyVariables(maxVar);
          if (comp.example?.body_text && comp.example.body_text[0]) {
            setBodyExamples([comp.example.body_text[0]]);
          }
        }
        bodyFound = true;
      } else if (comp.type === 'FOOTER') {
        setFooterText(comp.text || '');
        footerFound = true;
      } else if (comp.type === 'BUTTONS' && comp.buttons) {
        buttonsFound = comp.buttons.map(btn => ({ text: btn.text || '' }));
        setButtons(buttonsFound);
      }
    });

    if (!headerFound) setHeaderFormat('NONE');
    if (!bodyFound) {
      setBodyText('');
      setBodyVariables(0);
      setBodyExamples([]);
    }
    if (!footerFound) setFooterText('');
    if (buttonsFound.length === 0) setButtons([]);

    setOpenCreate(true);
  };

  // Reset & Close
  const closeAll = () => {
    setTemplateName('');
    setCategory('MARKETING');
    setLanguage('');
    setHeaderFormat('NONE');
    setHeaderText('');
    setHeaderExample([]);
    setMediaType('IMAGE');
    setMediaUrl('');
    setUploadingMedia(false);
    setBodyText('');
    setBodyVariables(0);
    setBodyExamples([]);
    setFooterText('');
    setButtons([]);
    setErrors({});
    setOpenCreate(false);
    setOpenSample(false);
    setEditingTemplateId(null);
    setIsEditMode(false);
  };

  // JSON Viewer with Copy
  const JsonViewer = ({ code }) => {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const copyToClipboard = () => {
      navigator.clipboard.writeText(JSON.stringify(code, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="text-xs">
        {/* <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-blue-600 hover:underline"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Code JSON
        </button> */}
        {expanded && (
          <div className="mt-2 p-2 bg-gray-100 rounded border text-xs font-mono overflow-auto max-h-48">
            <div className="flex justify-end mb-1">
              <button
                onClick={copyToClipboard}
                className="text-gray-500 hover:text-gray-700"
                title="Copy JSON"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <pre>{JSON.stringify(code, null, 2)}</pre>
          </div>
        )}
      </div>
    );
  };

  // Status Badge
  const StatusBadge = ({ status, is_disabled }) => {
    if (is_disabled === 1) {
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600 dark:bg-[#3d3d3d] dark:text-[#d1d5db]">
          Disabled
        </span>
      );
    }
    const color = status === 'APPROVED' ? 'bg-green-600 text-white font-semibold' : 'bg-yellow-500 text-white';
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{status}</span>;
  };

  return (
    <>
      {/* Header + Create Button */}
      <div className="w-full px-4 py-6 sm:px-6 bg-white dark:bg-[#262626] min-h-screen">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => navigate(`/elections/communication`)}
            className="flex items-center gap-2 text-sm transition-colors text-gray-600 dark:text-[#d1d5db] hover:text-gray-900 dark:hover:text-[#ececf1]"
          >
            <ArrowLeft size={16} />
            <span>Back to Campaign</span>
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-[#ececf1]">WhatsApp Templates</h1>
          <button
            onClick={() => setOpenCreate(true)}
            className="flex w-full items-center justify-center gap-2 rounded-3xl px-5 py-2.5 text-sm font-semibold tracking-wide shadow-sm hover:shadow-md sm:w-auto bg-black text-white dark:bg-white dark:text-black"
          >
            <Plus className="h-4 w-4" />
            Create New Template
          </button>

        </div>

        {/* Table */}
        {fetching ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-10 h-10 animate-spin dark:text-white dark:text-black mx-auto mt-20 justify-center items-center" />
          </div>
        ) : templates.length === 0 ? (
          <div className="rounded-lg bg-gray-50 dark:bg-[#1f1f1f] py-16 text-center">
            <p className="text-lg text-gray-500 dark:text-[#d1d5db]">No templates yet.</p>
            <p className="mt-2 text-sm text-gray-400 dark:text-[#8e8ea0]">Create your first WhatsApp template to get started</p>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="space-y-4 lg:hidden">
              {templates.map((t, i) => (
                <div key={t.id || i} className="rounded-2xl border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#2d2d2d] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-[#ececf1]">
                        <span>{t.name}</span>
                        <CopyButton text={t.name} />
                      </div>
                      <p className="text-xs uppercase text-gray-500 dark:text-[#8e8ea0]">{t.category}</p>
                    </div>
                    <StatusBadge status={t.status} is_disabled={t.is_disabled} />
                  </div>
                  <div className="mt-3 text-sm text-gray-700 dark:text-[#d1d5db]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      <Check className="h-3 w-3" />
                      {t.language.toLowerCase()}
                    </span>
                  </div>

                  <div className="mt-3 rounded-lg border border-dashed border-gray-200 dark:border-[#3d3d3d] bg-gray-50 dark:bg-[#1f1f1f] p-3 text-xs">
                    <JsonViewer code={t.code} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {t.template_id && (
                      <button
                        onClick={() => loadTemplateForEdit(t)}
                        className="flex-1 min-w-[140px] rounded-lg border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => deleteTemplate(integratedNumber, t.name)}
                      className="flex-1 min-w-[140px] rounded-lg border border-red-500 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block">
              <div className="overflow-hidden rounded-sm border border-gray-200 dark:border-[#3d3d3d] bg-white dark:bg-[#2d2d2d]">
                <div className="overflow-x-auto">
                  <table className="min-w-[960px] w-full divide-y divide-gray-200 dark:divide-[#3d3d3d]">
                    <thead className="bg-gray-50 dark:bg-[#1f1f1f]">
                      <tr>
                        <th className="px-6 py-3 text-left text-md font-normal  tracking-wider text-black dark:text-[#ececf1]">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-md font-normal  tracking-wider text-black dark:text-[#ececf1]">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-md font-normal tracking-wider text-black dark:text-[#ececf1]">
                          Language
                        </th>
                        {/* <th className="px-6 py-3 text-left text-md font-normal  tracking-wider text-black">
                          Clicks
                        </th> */}
                        {/* <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                          Code JSON
                        </th> */}

                        <th className="px-6 py-3 text-left text-md font-normal  tracking-wider text-black dark:text-[#ececf1]">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-[#8e8ea0]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-[#3d3d3d] bg-white dark:bg-[#2d2d2d]">
                      {templates.map((t, i) => (
                        <tr key={t.id || i} className="hover:bg-gray-50 dark:hover:bg-[#353535]">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-[#ececf1]">
                            <div className="flex items-center gap-2">
                              <span>{t.name}</span>
                              <CopyButton text={t.name} />
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-[#d1d5db]">{t.category}</td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-[#d1d5db]">
                            <span className="inline-flex items-center gap-1">
                              <Check className="w-3 h-3 text-green-600" />
                              {t.language.toLowerCase()}
                            </span>
                          </td>
                          {/* <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">-</td> */}
                          {/* <td className="px-6 py-4">
                            <JsonViewer code={t.code} />
                          </td> */}
                          <td className="whitespace-nowrap px-6 py-4">
                            <StatusBadge status={t.status} is_disabled={t.is_disabled} />
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2 mr-10">
                              {t.template_id && (
                                <button
                                  onClick={() => loadTemplateForEdit(t)}
                                  className="text-black dark:text-white"
                                  title="Edit template"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {/* <button
                                onClick={() => deleteTemplate(integratedNumber, t.name)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete template"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button> */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* CREATE MODAL (Step 1) */}
      {openCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-[#3d3d3d] flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-[#ececf1]">{isEditMode ? 'Update Template' : 'Create Template'}</h2>
              <button onClick={closeAll} className="text-gray-500 dark:text-[#8e8ea0] hover:text-gray-700 dark:hover:text-[#ececf1] p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3a3a3a]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 grid md:grid-cols-2 gap-6 p-6 overflow-y-auto">
              {/* LEFT: Form */}
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#d1d5db] mb-1">Name *</label>
                  <input
                    value={templateName}
                    onChange={e => {
                      const value = e.target.value;
                      setTemplateName(value);

                      setErrors(prev => {
                        const newErrors = { ...prev };

                        if (!value.trim()) {
                          newErrors.template_name = 'This field is required';
                        } else if (!TEMPLATE_NAME_REGEX.test(value.trim())) {
                          newErrors.template_name =
                            'The message template name can only have lower-case letters and underscores';
                        } else {
                          delete newErrors.template_name;
                        }

                        return newErrors;
                      });
                    }}
                    disabled={isEditMode}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-[#1f1f1f] dark:text-[#ececf1] dark:border-[#3d3d3d] ${errors.template_name ? 'border-red-500' : 'border-gray-300'
                      } ${isEditMode ? 'bg-gray-100 dark:bg-[#3a3a3a] cursor-not-allowed' : ''}`}
                    placeholder="e.g. order_confirmation"
                  />
                  {errors.template_name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.template_name}
                    </p>
                  )}
                  {isEditMode && <p className="text-gray-500 dark:text-[#8e8ea0] text-xs mt-1">Template name cannot be changed</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#d1d5db] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    disabled={isEditMode}
                    className={`w-full border border-gray-300 dark:border-[#3d3d3d] dark:bg-[#1f1f1f] dark:text-[#ececf1] rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${isEditMode ? 'bg-gray-100 dark:bg-[#3a3a3a] cursor-not-allowed' : ''
                      }`}
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                  {isEditMode && <p className="text-gray-500 dark:text-[#8e8ea0] text-xs mt-1">Category cannot be changed</p>}
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#d1d5db] mb-1">Language</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    disabled={isEditMode}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-[#1f1f1f] dark:text-[#ececf1] dark:border-[#3d3d3d] ${errors.language ? 'border-red-500' : 'border-gray-300'
                      } ${isEditMode ? 'bg-gray-100 dark:bg-[#3a3a3a] cursor-not-allowed' : ''}`}
                  >
                    <option value="">Select Language</option>
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="te">Telugu</option>
                    <option value="ta">Tamil</option>
                  </select>
                  {errors.language && <p className="text-red-500 text-xs mt-1">This field is required</p>}
                  {isEditMode && <p className="text-gray-500 dark:text-[#8e8ea0] text-xs mt-1">Language cannot be changed</p>}
                </div>

                {/* Header */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#d1d5db] mb-2">Header</label>
                  <select
                    value={headerFormat}
                    onChange={e => {
                      setHeaderFormat(e.target.value);
                      if (e.target.value !== 'TEXT') {
                        setHeaderText('');
                        setHeaderExample([]);
                      }
                      if (e.target.value !== 'MEDIA') {
                        setMediaUrl('');
                        setMediaType('IMAGE');
                      }
                    }}
                    className="w-full border border-gray-300 dark:border-[#3d3d3d] dark:bg-[#1f1f1f] dark:text-[#ececf1] rounded-lg px-3 py-2 mb-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="NONE">None</option>
                    <option value="TEXT">Text</option>
                    <option value="MEDIA">Media</option>
                  </select>
                  {headerFormat === 'TEXT' && (
                    <input
                      value={headerText}
                      onChange={e => setHeaderText(e.target.value)}
                      placeholder="Header text (e.g. Order Confirmed)"
                      className="w-full border border-gray-300 dark:border-[#3d3d3d] dark:bg-[#1f1f1f] dark:text-[#ececf1] rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                  {headerFormat === 'MEDIA' && (
                    <select
                      value={mediaType}
                      onChange={e => setMediaType(e.target.value)}
                      className="w-full border border-gray-300 dark:border-[#3d3d3d] dark:bg-[#1f1f1f] dark:text-[#ececf1] rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="IMAGE">Image</option>
                      <option value="VIDEO">Video</option>
                      <option value="DOCUMENT">Document</option>
                    </select>
                  )}
                </div>

                {/* Body */}
                <div>
                  <div className="flex justify-between items-center mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-[#d1d5db]">Body *</label>
                      <button
                        type="button"
                        onClick={addBodyVariable}
                        className="text-blue-600 text-xs flex items-center gap-1 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <Plus className="w-3 h-3" /> Add Variable
                      </button>
                    </div>
                    <span
                      className={`text-xs ${bodyText.length >= BODY_CHAR_LIMIT ? 'text-red-500' : 'text-gray-500 dark:text-[#8e8ea0]'
                        }`}
                    >
                      {bodyText.length}/{BODY_CHAR_LIMIT}
                    </span>
                  </div>
                  <textarea
                    value={bodyText}
                    onChange={e => {
                      const value = e.target.value;
                      if (value.length <= BODY_CHAR_LIMIT) {
                        setBodyText(value);
                        if (errors.body && value.length <= BODY_CHAR_LIMIT && value.trim()) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.body;
                            return newErrors;
                          });
                        }
                      }
                    }}
                    placeholder="Your message here... (e.g. Hi {{1}}, your order {{2}} is confirmed!)"
                    rows={4}
                    maxLength={BODY_CHAR_LIMIT}
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-[#1f1f1f] dark:text-[#ececf1] dark:border-[#3d3d3d] ${errors.body || bodyText.length >= BODY_CHAR_LIMIT ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body}</p>}
                  {!errors.body && bodyText.length >= BODY_CHAR_LIMIT && (
                    <p className="text-red-500 text-xs mt-1">Body cannot exceed 1024 characters</p>
                  )}
                </div>

                {/* Footer */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-[#d1d5db]">Footer (Optional)</label>
                    <span className={`text-xs ${footerText.length > 60 ? 'text-red-500' : 'text-gray-500 dark:text-[#8e8ea0]'}`}>
                      {footerText.length}/60
                    </span>
                  </div>
                  <input
                    value={footerText}
                    onChange={e => {
                      const value = e.target.value;
                      if (value.length <= 60) {
                        setFooterText(value);
                        if (errors.footer) {
                          setErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.footer;
                            return newErrors;
                          });
                        }
                      }
                    }}
                    maxLength={60}
                    placeholder="Add a short line of text to the bottom of your message template."
                    className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:bg-[#1f1f1f] dark:text-[#ececf1] dark:border-[#3d3d3d] ${errors.footer || footerText.length > 60 ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.footer && <p className="text-red-500 text-xs mt-1">{errors.footer}</p>}
                  {footerText.length > 60 && !errors.footer && (
                    <p className="text-red-500 text-xs mt-1">Footer cannot exceed 60 characters</p>
                  )}
                </div>

                {/* Buttons */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-[#d1d5db]">Button (Optional)</label>
                    <button
                      type="button"
                      onClick={addButton}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded-full text-sm flex items-center gap-1 hover:bg-blue-700"
                    >
                      <Plus className="w-3 h-3" /> Add Button
                    </button>
                  </div>
                  <div className="space-y-2">
                    {buttons.map((btn, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 dark:text-[#8e8ea0] mb-1">Button Text *</label>
                          <input
                            value={btn.text}
                            onChange={e => updateButton(i, e.target.value)}
                            placeholder="yes"
                            className="w-full border border-gray-300 dark:border-[#3d3d3d] dark:bg-[#1f1f1f] dark:text-[#ececf1] rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeButton(i)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-[#3a2a2a] mt-5"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: Preview */}
              <div className="bg-[#f6f0e9] dark:bg-[#1f1f1f] rounded-xl p-6">
                <h3 className="font-medium mb-4 text-gray-700 dark:text-[#d1d5db] flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Preview
                </h3>
                <div className="bg-white dark:bg-[#2d2d2d] border border-gray-200 dark:border-[#3d3d3d] rounded-lg p-4 text-sm">
                  {preview.headerMedia && (
                    <div className="mb-3 rounded overflow-hidden border border-gray-200 dark:border-[#3d3d3d]">
                      {preview.headerMedia.type === 'IMAGE' && preview.headerMedia.url ? (
                        <div className="bg-gray-100 dark:bg-[#1f1f1f] p-4 text-center">
                          <p className="text-gray-600 dark:text-[#8e8ea0] text-xs">📷 Image will be displayed here</p>
                        </div>
                      ) : preview.headerMedia.type === 'VIDEO' && preview.headerMedia.url ? (
                        <div className="bg-gray-100 dark:bg-[#1f1f1f] p-4 text-center">
                          <p className="text-gray-600 dark:text-[#8e8ea0] text-xs">🎥 Video will be displayed here</p>
                        </div>
                      ) : preview.headerMedia.type === 'DOCUMENT' && preview.headerMedia.url ? (
                        <div className="bg-gray-100 dark:bg-[#1f1f1f] p-4 text-center">
                          <p className="text-gray-600 dark:text-[#8e8ea0] text-xs">📄 Document will be attached</p>
                        </div>
                      ) : (
                        <div className="bg-gray-100 dark:bg-[#1f1f1f] p-4 text-center">
                          <p className="text-gray-400 dark:text-[#8e8ea0] text-xs">Upload media in sample section</p>
                        </div>
                      )}
                    </div>
                  )}
                  {preview.header && (
                    <p className="font-medium mb-3 text-gray-900 dark:text-[#ececf1] border-b border-gray-200 dark:border-[#3d3d3d] pb-2 text-[15px]">{preview.header}</p>
                  )}
                  {preview.body && <p className="mb-3 text-gray-800 dark:text-[#d1d5db] leading-relaxed">{preview.body}</p>}
                  {preview.footer && (
                    <p className="text-gray-700 dark:text-[#8e8ea0] text-[12px] mb-3 italic border-t border-gray-200 dark:border-[#3d3d3d] pt-2">{preview.footer}</p>
                  )}
                  {preview.buttons && preview.buttons.length > 0 && (
                    <div className="space-y-2 mt-4">
                      {preview.buttons.map((b, i) => (
                        <button
                          key={i}
                          className="flex w-full items-center justify-between bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-3 rounded border border-blue-200 transition-colors text-sm"
                        >
                          <span>{b}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  )}
                  {Object.keys(preview).length === 0 && (
                    <p className="text-gray-400 dark:text-[#8e8ea0] text-center py-8">Preview will appear here...</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-[#3d3d3d] bg-gray-50 dark:bg-[#1f1f1f]">
              <button
                onClick={closeAll}
                className="px-4 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg hover:bg-gray-100 dark:hover:bg-[#3a3a3a] text-gray-700 dark:text-[#d1d5db] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={isEditMode ? () => setOpenSample(true) : onFirstSave}
                disabled={!templateName || !language || !bodyText}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" /> {isEditMode ? 'Update Preview' : 'Add Sample'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAMPLE MODAL (Step 2) */}
      {openSample && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#2d2d2d] rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-[#3d3d3d] flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-[#ececf1]">{isEditMode ? 'Update Template' : 'Add Sample Content'}</h2>
                <p className="text-sm text-gray-600 dark:text-[#8e8ea0] mt-1">
                  {isEditMode
                    ? 'Review and update your template. Sample values are required for variables.'
                    : (
                      <>
                        Provide sample values for variables. <strong className="text-red-600">Required</strong>.
                      </>
                    )}
                </p>
              </div>
              <button
                onClick={() => setOpenSample(false)}
                className="text-gray-500 dark:text-[#8e8ea0] hover:text-gray-700 dark:hover:text-[#ececf1] p-1 rounded hover:bg-gray-100 dark:hover:bg-[#3a3a3a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Media Upload Section */}
              {headerFormat === 'MEDIA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#d1d5db] mb-3">
                    Upload {mediaType === 'IMAGE' ? 'Image' : mediaType === 'VIDEO' ? 'Video' : 'Document'}
                  </label>
                  <div className="space-y-3">
                    <input
                      type="file"
                      accept={
                        mediaType === 'IMAGE' ? 'image/*' :
                          mediaType === 'VIDEO' ? 'video/*' :
                            '.pdf,.doc,.docx'
                      }
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setUploadingMedia(true);
                        try {
                          const response = await uploadTemplateMedia(file, integratedNumber);

                          // Parse the response format
                          if (response.success && response.url) {
                            setMediaUrl(response.url);
                            toast.success('Media uploaded successfully!');
                          } else {
                            toast.error('Failed to upload media');
                          }
                        } catch (error) {
                          console.error('Upload error:', error);
                          toast.error('Failed to upload media');
                        } finally {
                          setUploadingMedia(false);
                        }
                      }}
                      className="w-full border border-gray-300 dark:border-[#3d3d3d] dark:bg-[#1f1f1f] dark:text-[#ececf1] rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                      disabled={uploadingMedia}
                    />
                    {uploadingMedia && (
                      <div className="flex items-center gap-2 text-white text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </div>
                    )}
                    {mediaUrl && !uploadingMedia && (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <Check className="w-4 h-4" />
                        <span>Media uploaded successfully</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {bodyVariables > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-[#d1d5db] mb-3">Body Variables</label>
                  <div className="space-y-3">
                    {Array.from({ length: bodyVariables }).map((_, i) => (
                      <div key={i}>
                        <label className="block text-xs font-medium text-gray-600 dark:text-[#8e8ea0] mb-1">
                          Sample for{' '}
                          <code className="bg-gray-100 dark:bg-[#1f1f1f] px-1 py-0.5 rounded text-xs font-mono">
                            {'{{'} {i + 1} {'}}'}
                          </code>
                        </label>
                        <input
                          value={bodyExamples[0]?.[i] || ''}
                          onChange={e => {
                            const value = e.target.value;
                            setBodyExamples(prev => {
                              const newEx = prev[0] ? [...prev] : [[]];
                              newEx[0][i] = value;
                              return newEx;
                            });
                          }}
                          placeholder="e.g. John Doe"
                          className="w-full border border-gray-300 dark:border-[#3d3d3d] dark:bg-[#1f1f1f] dark:text-[#ececf1] rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bodyVariables === 0 && headerFormat !== 'MEDIA' && (
                <div className="text-center py-8 text-gray-500 dark:text-[#8e8ea0]">
                  <p>No variables to configure</p>
                  <p className="text-sm mt-1">Your template doesn't have any variables</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-[#3d3d3d] bg-gray-50 dark:bg-[#1f1f1f]">
              <button
                onClick={() => setOpenSample(false)}
                className="px-4 py-2 border border-gray-300 dark:border-[#3d3d3d] rounded-lg hover:bg-gray-100 dark:hover:bg-[#3a3a3a] text-gray-700 dark:text-[#d1d5db] transition-colors"
              >
                Back
              </button>
              <button
                onClick={onFinalSubmit}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isEditMode ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> {isEditMode ? 'Update' : 'Save'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
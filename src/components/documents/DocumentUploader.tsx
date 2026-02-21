// Document Uploader Component
// Feature: Multi-document upload with type tagging

import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, Download, Eye, X, File, Image, FileSpreadsheet } from 'lucide-react';
import api from '../../services/apiService';

interface UploadedDocument {
  id: string;
  file_name: string;
  document_type: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  created_at: string;
}

interface DocumentUploaderProps {
  patientId: string;
  patientName?: string;
}

const DOCUMENT_TYPES = [
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'imaging', label: 'Imaging (X-Ray, CT, MRI)' },
  { value: 'insurance', label: 'Insurance Document' },
  { value: 'consent', label: 'Consent Form' },
  { value: 'referral', label: 'Referral Letter' },
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'other', label: 'Other' },
];

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ patientId, patientName }) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState('other');
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, [patientId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.documents.list(patientId);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Could not load documents:', err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      return;
    }

    setUploading(true);
    try {
      await api.documents.upload(patientId, file, selectedType, description);
      setDescription('');
      await loadDocuments();
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  const deleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.documents.delete(docId);
      await loadDocuments();
    } catch (err: any) {
      alert('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return <File size={20} className="text-gray-500" />;
    if (mimeType.startsWith('image/')) return <Image size={20} className="text-blue-500" />;
    if (mimeType.includes('pdf')) return <FileText size={20} className="text-red-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet size={20} className="text-green-500" />;
    return <File size={20} className="text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Upload className="text-blue-600" size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Documents</h2>
          <p className="text-sm text-gray-600">
            {patientName ? `${patientName} - ` : ''}{documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {DOCUMENT_TYPES.map(dt => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <>
              <Upload size={32} className="mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">
                Drop file here or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PDF, Images, Documents (Max 10MB)
              </p>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv"
        />
      </div>

      {/* Document List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <FileText size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-600">No documents yet</p>
          <p className="text-sm text-gray-500 mt-1">Upload the first document for this patient</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.mime_type)}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doc.file_name}</div>
                        {doc.description && (
                          <div className="text-xs text-gray-500">{doc.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 capitalize">
                      {doc.document_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(doc.file_size)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(doc.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={api.documents.getDownloadUrl(doc.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;

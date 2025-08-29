import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

const InvoiceUpload: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setProcessing(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/upload-invoice',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br-main">
      <div className="max-w-6xl py-12 px-4">

        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-step1 rounded-2xl mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI-Powered Invoice Processing
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your paper invoices into structured data instantly
          </p>

          <div className="flex justify-center space-x-12 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">95%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">30s</div>
              <div className="text-sm text-gray-600">Processing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">100%</div>
              <div className="text-sm text-gray-600">Secure</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-12 mb-12">
          <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
            isDragActive ? 'border-blue-500 bg-gradient-to-br-blue' : 'border-gray-300'
          }`}>
            <input {...getInputProps()} />

            {processing ? (
              <div className="space-y-6">
                <div className="w-24 h-24 mx-auto animate-spin">
                  <svg className="w-24 h-24 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Processing Invoice...</h3>
              </div>
            ) : (
              <div className="space-y-8">
                <div style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto',
                  background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '4px dashed #93c5fd'
                }}>
                  <svg width="60" height="60" fill="none" stroke="#3b82f6" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Invoice</h3>
                  <p className="text-lg text-gray-600 mb-8">
                    Drag and drop your invoice here, or click to browse
                  </p>
                  <button className="bg-gradient-btn text-white px-10 py-4 rounded-xl font-semibold text-lg shadow-lg hover-lift">
                    Choose File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-step1 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Upload</h4>
              <p className="text-gray-600">Drop your invoice or click to select</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-step2 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Process</h4>
              <p className="text-gray-600">AI extracts data with 95% accuracy</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-step3 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-3">Export</h4>
              <p className="text-gray-600">Get structured, ready-to-use data</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-8 bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
            <h4 className="font-semibold text-red-800">Processing Failed</h4>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-8 bg-green-50 border-l-4 border-green-500 p-6 rounded-lg shadow-lg">
            <h4 className="text-xl font-semibold text-green-800 mb-4">Invoice Processed Successfully!</h4>
            <div className="bg-white rounded-lg p-4 mb-6 border shadow-sm">
              <pre className="text-sm text-gray-800 overflow-x-auto">
                {JSON.stringify(result.processed_data, null, 2)}
              </pre>
            </div>
            <p className="text-green-700">
              Invoice ID: {result.invoice_id} - Go to /invoices/{result.invoice_id} to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceUpload;
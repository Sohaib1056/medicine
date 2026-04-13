import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Upload, X, FileText, CheckCircle } from 'lucide-react';

const EmptyCart = () => {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUploadSuccess(true);
      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedFiles([]);
        setUploadSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload prescription. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        {/* Cart Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full">
            <ShoppingCart size={64} className="text-gray-400" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">
          Your cart is empty
        </h2>
        
        {/* Subtext */}
        <p className="text-base text-[#666666] mb-8">
          Looks like you haven't added any medicines yet
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/medicines"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#00A651] text-white rounded-lg hover:bg-[#008f47] transition-colors font-semibold shadow-lg hover:shadow-xl"
          >
            Start Shopping
          </Link>
          
          <button 
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-[#00A651] border-2 border-[#00A651] rounded-lg hover:bg-[#E8F5E9] transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <Upload size={20} />
            Upload Prescription
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-12 pt-8 border-t border-[#E0E0E0]">
          <p className="text-sm text-[#666666] mb-4">Popular Categories</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/medicines"
              className="px-4 py-2 bg-gray-50 text-[#666666] rounded-full hover:bg-[#E8F5E9] hover:text-[#00A651] transition-colors text-sm"
            >
              Medicines
            </Link>
            <Link
              to="/wellness"
              className="px-4 py-2 bg-gray-50 text-[#666666] rounded-full hover:bg-[#E8F5E9] hover:text-[#00A651] transition-colors text-sm"
            >
              Vitamins
            </Link>
            <Link
              to="/health-devices"
              className="px-4 py-2 bg-gray-50 text-[#666666] rounded-full hover:bg-[#E8F5E9] hover:text-[#00A651] transition-colors text-sm"
            >
              Health Devices
            </Link>
            <Link
              to="/personal-care"
              className="px-4 py-2 bg-gray-50 text-[#666666] rounded-full hover:bg-[#E8F5E9] hover:text-[#00A651] transition-colors text-sm"
            >
              Personal Care
            </Link>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-[#1A1A1A]">Upload Prescription</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                  setUploadSuccess(false);
                }}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {uploadSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="text-[#00A651] mx-auto mb-4" size={64} />
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">
                    Prescription Uploaded Successfully!
                  </h3>
                  <p className="text-[#666666]">
                    Our pharmacist will review your prescription and contact you shortly.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-[#1A1A1A] mb-2">Instructions:</h3>
                    <ul className="text-sm text-[#666666] space-y-1 list-disc list-inside">
                      <li>Upload clear images or PDF of your prescription</li>
                      <li>Accepted formats: JPG, PNG, PDF (Max 5MB per file)</li>
                      <li>You can upload multiple prescriptions</li>
                      <li>Our pharmacist will verify and process your order</li>
                    </ul>
                  </div>

                  <div
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#00A651] transition"
                  >
                    <Upload className="text-gray-400 mx-auto mb-4" size={48} />
                    <p className="text-[#1A1A1A] font-medium mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-[#666666]">
                      JPG, PNG or PDF (Max 5MB)
                    </p>
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-bold text-[#1A1A1A] mb-3">
                        Selected Files ({selectedFiles.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="text-[#00A651]" size={24} />
                              <div>
                                <p className="font-medium text-[#1A1A1A]">{file.name}</p>
                                <p className="text-xs text-[#666666]">
                                  {(file.size / 1024).toFixed(2)} KB
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFile(index);
                              }}
                              className="text-red-500 hover:text-red-700 transition"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || uploading}
                    className="w-full mt-6 bg-[#00A651] text-white py-3 rounded-lg font-medium hover:bg-[#008f47] transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        Upload Prescription
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmptyCart;

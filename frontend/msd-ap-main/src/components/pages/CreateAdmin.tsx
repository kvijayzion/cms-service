import React, { useState } from 'react';
import { Shield, ArrowLeft, ArrowRight, CheckCircle, Smartphone, User, Mail, Lock } from 'lucide-react';
import { PageType } from '../../App';

interface AdminFormData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  phoneNumber: string;
  permissions: string[];
}

interface CreateAdminProps {
  onPageChange: (page: PageType) => void;
}

export const CreateAdmin: React.FC<CreateAdminProps> = ({ onPageChange }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [formData, setFormData] = useState<AdminFormData>({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Administrator',
    department: '',
    phoneNumber: '',
    permissions: []
  });

  const availablePermissions = [
    { id: 'user_management', label: 'User Management', description: 'Create, update, and delete user accounts' },
    { id: 'vendor_management', label: 'Vendor Management', description: 'Manage vendor accounts and KYC' },
    { id: 'inventory_management', label: 'Inventory Management', description: 'Manage product inventory and stock' },
    { id: 'delivery_management', label: 'Delivery Management', description: 'Manage delivery personnel and assignments' },
    { id: 'support_management', label: 'Support Management', description: 'Handle customer support tickets' },
    { id: 'catalog_management', label: 'Catalog Management', description: 'Manage products and categories' },
    { id: 'system_settings', label: 'System Settings', description: 'Configure platform settings' },
    { id: 'admin_management', label: 'Admin Management', description: 'Create and manage administrator accounts' }
  ];

  const handleInputChange = (field: keyof AdminFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate form data
      if (!formData.firstName || !formData.lastName || !formData.email) {
        alert('Please fill in all required fields');
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleMfaVerification = async () => {
    setIsLoading(true);
    
    // Simulate API call for MFA verification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (mfaCode === '123456') { // Mock verification
      // Simulate admin creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCurrentStep(3);
    } else {
      alert('Invalid MFA code. Please try again.');
    }
    
    setIsLoading(false);
  };

  const handleBackToDashboard = () => {
    onPageChange('dashboard');
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
          currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          <User size={20} />
        </div>
        <div className={`w-16 h-1 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
          currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          <Shield size={20} />
        </div>
        <div className={`w-16 h-1 ${currentStep >= 3 ? 'bg-green-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
          currentStep >= 3 ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          <CheckCircle size={20} />
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Details</h2>
        <p className="text-gray-600">Enter the basic information for the new administrator</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter first name"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter last name"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="admin@mysillydeams.com"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select
            value={formData.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Administrator">Administrator</option>
            <option value="Super Administrator">Super Administrator</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => handleInputChange('department', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Operations, Support"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="+1 (555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">Permissions</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availablePermissions.map((permission) => (
            <div key={permission.id} className="border border-gray-200 rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.permissions.includes(permission.id)}
                  onChange={() => handlePermissionToggle(permission.id)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">{permission.label}</div>
                  <div className="text-sm text-gray-500">{permission.description}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">MFA Verification</h2>
        <p className="text-gray-600">Enter your 6-digit MFA code to create the new administrator</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Admin Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Name:</span>
            <span className="font-medium">{formData.firstName} {formData.lastName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{formData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Role:</span>
            <span className="font-medium">{formData.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Permissions:</span>
            <span className="font-medium">{formData.permissions.length} selected</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          MFA Code <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value)}
          placeholder="000000"
          maxLength={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center tracking-widest text-lg"
        />
        <p className="text-sm text-gray-600 mt-2">
          Enter the 6-digit code from your authenticator app
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Created Successfully!</h2>
        <p className="text-gray-600">
          The new administrator account for <strong>{formData.firstName} {formData.lastName}</strong> has been created successfully.
        </p>
      </div>
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-center space-x-2 text-green-800">
          <Mail className="w-5 h-5" />
          <span className="font-medium">Login credentials sent to {formData.email}</span>
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          The new admin will receive an email with their temporary password and setup instructions.
        </p>
        <p className="text-sm text-gray-600">
          They will be required to change their password and set up MFA on first login.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <button
            onClick={() => onPageChange('admins')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderStepIndicator()}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            {currentStep === 1 && (
              <>
                <button
                  onClick={() => onPageChange('admins')}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <span>Continue</span>
                  <ArrowRight size={16} />
                </button>
              </>
            )}

            {currentStep === 2 && (
              <>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
                <button
                  onClick={handleMfaVerification}
                  disabled={mfaCode.length !== 6 || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Shield size={16} />
                  <span>{isLoading ? 'Creating Admin...' : 'Create Admin'}</span>
                </button>
              </>
            )}

            {currentStep === 3 && (
              <div className="w-full flex justify-center">
                <button
                  onClick={handleBackToDashboard}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
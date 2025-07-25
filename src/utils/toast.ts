import { toast, ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => 
    toast.success(message, { ...defaultOptions, ...options }),
  
  error: (message: string, options?: ToastOptions) => 
    toast.error(message, { ...defaultOptions, ...options }),
  
  info: (message: string, options?: ToastOptions) => 
    toast.info(message, { ...defaultOptions, ...options }),
  
  warning: (message: string, options?: ToastOptions) => 
    toast.warning(message, { ...defaultOptions, ...options }),
  
  // Specialized toasts for common scenarios
  saved: (item: string = 'Item') => 
    toast.success(`${item} saved successfully!`),
  
  deleted: (item: string = 'Item') => 
    toast.success(`${item} deleted successfully!`),
  
  updated: (item: string = 'Item') => 
    toast.success(`${item} updated successfully!`),
  
  saveFailed: (item: string = 'Item', error?: string) => 
    toast.error(`Failed to save ${item.toLowerCase()}. ${error || 'Please try again.'}`),
  
  deleteFailed: (item: string = 'Item', error?: string) => 
    toast.error(`Failed to delete ${item.toLowerCase()}. ${error || 'Please try again.'}`),
  
  updateFailed: (item: string = 'Item', error?: string) => 
    toast.error(`Failed to update ${item.toLowerCase()}. ${error || 'Please try again.'}`),
  
  validationError: (message: string) => 
    toast.warning(message),
  
  connectionError: () => 
    toast.error('Connection error. Please check your internet connection and try again.'),
  
  databaseError: () => 
    toast.error('Database connection issue. Please check your configuration.'),
  
  // Loading toast with promise
  promise: <T>(
    promise: Promise<T>, 
    { pending, success, error }: { pending: string; success: string; error: string }
  ) => 
    toast.promise(promise, { pending, success, error }, defaultOptions)
}; 
import React, { useState, useEffect } from 'react';
import './style.css'; // Make sure to import your CSS file

// Assuming you've installed and imported the Zoho SDK in your application
// If not, you'll need to add: npm install zohostatic-creator-widgets
// And import it in your main file or add it to your public/index.html

function OrderTrackingApp() {
  // State hooks
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [products, setProducts] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updatingRecord, setUpdatingRecord] = useState(null);
  const [updatedStatus, setUpdatedStatus] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    Customer_Name: '',
    Date_field: new Date().toISOString().split('T')[0], // Default to today
    Products: '',
    Status: ''
  });
  
  // Format dates consistently
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    } catch (error) {
      console.error(`Error formatting date ${dateString}: ${error.message}`);
      return dateString;
    }
  };
  
  // Convert date to DD-MMM-YYYY format for API calls
  const formatDateForAPI = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = String(date.getDate()).padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error(`Error formatting date for API ${dateString}: ${error.message}`);
      return dateString;
    }
  };
  
  // Get status class for styling
  const getStatusClass = (status) => {
    // Handle null or undefined status
    if (!status) return '';
    
    // If status is an object with display_value, use that
    if (typeof status === 'object' && status !== null) {
      if (status.display_value) {
        const statusValue = status.display_value;
        
        if (statusValue === 'Delivered') {
          return 'status-delivered';
        } else if (statusValue === 'Shipped') {
          return 'status-shipped';
        } else if (statusValue === 'Ordered') {
          return 'status-ordered';
        }
      }
      return '';
    }
    
    // If status is a string, use direct comparison
    if (typeof status === 'string') {
      if (status === 'Delivered') {
        return 'status-delivered';
      } else if (status === 'Shipped') {
        return 'status-shipped';
      } else if (status === 'Ordered') {
        return 'status-ordered';
      }
    }
    
    return '';
  };
  
  // Get display text from field value (handle objects with display_value)
  const getDisplayText = (value) => {
    if (typeof value === 'object' && value !== null) {
      if (value.display_value) {
        return value.display_value;
      } else {
        return JSON.stringify(value);
      }
    } else if (Array.isArray(value)) {
      return value.join(', ');
    } else {
      return value || '';
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    setError('');
    setSuccessMessage('');
    
    // Validate form
    if (!formData.Customer_Name.trim()) {
      setError('Customer Name is required');
      return;
    }
    
    if (!formData.Date_field) {
      setError('Date is required');
      return;
    }
    
    if (!formData.Products) {
      setError('Product is required');
      return;
    }
    
    if (!formData.Status) {
      setError('Status is required');
      return;
    }
    
    console.log('Submitting form data:', formData);
    setIsSubmitting(true);
    
    // Format date for API
    const formattedDate = formatDateForAPI(formData.Date_field);
    
    // Create data for API call
    const apiData = {
      data: {
        Customer_Name: formData.Customer_Name,
        Date_field: formattedDate,
        Products: formData.Products,
        Status: formData.Status
      }
    };
    
    try {
      // Configuration for adding record
      const config = {
        appName: "react-widgets",
        formName: "Order_Tracking",
        data: apiData
      };
      
      console.log('Adding record with config:', config);
      
      window.ZOHO.CREATOR.API.addRecord(config)
        .then(function(response) {
          console.log('Add record response:', response);
          
          if (response && response.code === 3000) {
            setSuccessMessage("Record added successfully");
            // Clear form
            setFormData({
              Customer_Name: '',
              Date_field: new Date().toISOString().split('T')[0],
              Products: '',
              Status: ''
            });
            
            // Refresh data
            fetchRecords();
            
            // Switch to list tab
            setActiveTab('list');
          } else {
            setError(`Failed to add record: ${response ? response.message : 'Unknown error'}`);
          }
          setIsSubmitting(false);
        })
        .catch(function(error) {
          setError("Error adding record: " + (error.message || "Unknown error"));
          console.error('Add record API error:', error);
          setIsSubmitting(false);
        });
    } catch (error) {
      setError("Error during add operation: " + error.message);
      console.error("Add record try-catch error:", error);
      setIsSubmitting(false);
    }
  };
  
  // Delete record function
  const deleteRecord = (recordId) => {
    setError('');
    setSuccessMessage('');
    setDeletingId(recordId);
    
    if (!recordId) {
      setError("No record ID provided for deletion");
      return;
    }
    
    try {
      // Configuration for deleting record
      const config = {
        appName: "react-widgets",
        reportName: "All_Order_Trackings",
        criteria: `(ID = "${recordId}")`
      };
      
      window.ZOHO.CREATOR.API.deleteRecord(config)
        .then(function(response) {
          console.log('Delete response:', response);
          
          if (response && response.code === 3000) {
            setSuccessMessage("Record deleted successfully");
            // Update data by removing the deleted record
            setData(data.filter(item => item.ID !== recordId));
          } else {
            setError(`Failed to delete record: ${response ? response.message : 'Unknown error'}`);
          }
          setDeletingId(null);
        })
        .catch(function(error) {
          setError("Error deleting record: " + (error.message || "Unknown error"));
          console.error('Delete API error:', error);
          setDeletingId(null);
        });
    } catch (error) {
      setError("Error during delete operation: " + error.message);
      console.error("Delete try-catch error:", error);
      setDeletingId(null);
    }
  };
  
  // Prepare update record
  const prepareUpdateRecord = (record) => {
    setUpdatingRecord(record);
    setUpdatedStatus(record.Status && record.Status.ID ? record.Status.ID : '');
    setShowUpdateModal(true);
  };
  
  // Handle status update
  const handleStatusUpdate = () => {
    setError('');
    setSuccessMessage('');
    
    if (!updatingRecord || !updatedStatus) {
      setError('No record or status selected for update');
      return;
    }
    
    try {
      // Create data for update
      const updateData = {
        data: {
          Status: updatedStatus
        }
      };
      
      // Configuration for updating record
      const config = {
        appName: "react-widgets",
        reportName: "All_Order_Trackings",
        id: updatingRecord.ID,
        data: updateData
      };
      
      console.log('Updating record with config:', config);
      
      window.ZOHO.CREATOR.API.updateRecord(config)
        .then(function(response) {
          console.log('Update response:', response);
          
          if (response && response.code === 3000) {
            setSuccessMessage("Record updated successfully");
            // Refresh data
            fetchRecords();
            // Close modal
            setShowUpdateModal(false);
            setUpdatingRecord(null);
            setUpdatedStatus('');
          } else {
            setError(`Failed to update record: ${response ? response.message : 'Unknown error'}`);
          }
        })
        .catch(function(error) {
          setError("Error updating record: " + (error.message || "Unknown error"));
          console.error('Update API error:', error);
        });
    } catch (error) {
      setError("Error during update operation: " + error.message);
      console.error("Update try-catch error:", error);
    }
  };
  
  // Fetch products
  const fetchProducts = () => {
    try {
      // Configuration for fetching products
      const config = {
        appName: "react-widgets",
        reportName: "All_Products"
      };
      
      console.log('Fetching products with config:', config);
      
      window.ZOHO.CREATOR.API.getAllRecords(config)
        .then(function(response) {
          if (response && response.data) {
            setProducts(response.data);
            console.log('Products fetched successfully');
          } else {
            console.log('No products data returned');
            setProducts([]);
          }
        })
        .catch(function(error) {
          console.error('Products API error:', error);
          setProducts([]);
        });
    } catch (error) {
      console.error("Fetch products try-catch error:", error);
      setProducts([]);
    }
  };
  
  // Fetch statuses
  const fetchStatuses = () => {
    try {
      // Configuration for fetching statuses
      const config = {
        appName: "react-widgets",
        reportName: "All_Statuses"
      };
      
      console.log('Fetching statuses with config:', config);
      
      window.ZOHO.CREATOR.API.getAllRecords(config)
        .then(function(response) {
          if (response && response.data) {
            setStatuses(response.data);
            console.log('Statuses fetched successfully');
          } else {
            console.log('No statuses data returned');
            setStatuses([]);
          }
        })
        .catch(function(error) {
          console.error('Statuses API error:', error);
          setStatuses([]);
        });
    } catch (error) {
      console.error("Fetch statuses try-catch error:", error);
      setStatuses([]);
    }
  };
  
  // Fetch records from Zoho
  const fetchRecords = () => {
    try {
      // Configuration for fetching records
      const config = {
        appName: "react-widgets",
        reportName: "All_Order_Trackings"
      };
      
      console.log('Fetching records with config:', config);
      
      window.ZOHO.CREATOR.API.getAllRecords(config)
        .then(function(response) {
          console.log('Received response:', response);
          
          // Check if response has the expected structure
          if (!response) {
            setError("Received empty response from Zoho API");
            return;
          }
          
          if (!response.data) {
            setError(`Response missing data property: ${JSON.stringify(response)}`);
            return;
          }
          
          // Set the data state
          setData(response.data);
          setIsLoading(false);
        })
        .catch(function(error) {
          setError("Error fetching records. Please check console for details.");
          console.error('API error:', error);
          setIsLoading(false);
        });
    } catch (error) {
      setError("Error during fetch operation: " + error.message);
      console.error("Fetch try-catch error:", error);
      setIsLoading(false);
    }
  };
  
  // Initialize the component
  useEffect(() => {
    if (window.ZOHO && window.ZOHO.CREATOR) {
      window.ZOHO.CREATOR.init()
        .then(function() {
          console.log('Zoho Creator initialized successfully');
          // Fetch dropdown values
          fetchProducts();
          fetchStatuses();
          // Fetch records
          fetchRecords();
        })
        .catch(function(error) {
          setError("Failed to initialize Zoho Creator. Please check console for details.");
          console.error('Init error:', error);
          setIsLoading(false);
        });
    } else {
      setError("Zoho Creator SDK not found. Please ensure it's properly loaded.");
      setIsLoading(false);
    }
  }, []);
  
  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  // Render form component
  const renderForm = () => {
    return (
      <div className="form-container">
        <h3 className="section-title">Add New Order</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="customerName">Customer Name:</label>
            <input
              type="text"
              id="customerName"
              name="Customer_Name"
              className="form-control"
              value={formData.Customer_Name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="orderDate">Order Date:</label>
            <input
              type="date"
              id="orderDate"
              name="Date_field"
              className="form-control"
              value={formData.Date_field}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="products">Product:</label>
            <select
              id="products"
              name="Products"
              className="form-control"
              value={formData.Products}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a Product</option>
              {products.map((product, index) => (
                <option key={index} value={product.ID}>
                  {product.Product_Name || product.Name || "Product " + (index + 1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              name="Status"
              className="form-control"
              value={formData.Status}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a Status</option>
              {statuses.map((status, index) => (
                <option key={index} value={status.ID}>
                  {status.Status || "Status " + (index + 1)}
                </option>
              ))}
            </select>
          </div>
          
          <button 
            type="submit" 
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Order'}
          </button>
        </form>
      </div>
    );
  };
  
  // Render order list component
  const renderOrderList = () => {
    return (
      <div id="tableContainer">
        <h3 className="section-title">Order List</h3>
        <table id="dataTable">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Date</th>
              <th>Products</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center' }}>
                  {isLoading ? 'Loading data...' : 'No records found.'}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={index}>
                  <td>{getDisplayText(item.Customer_Name)}</td>
                  <td>{formatDate(item.Date_field)}</td>
                  <td>{getDisplayText(item.Products)}</td>
                  <td className={getStatusClass(item.Status)}>
                    {getDisplayText(item.Status)}
                  </td>
                  <td>
                    <button 
                      className="update-btn"
                      onClick={() => prepareUpdateRecord(item)}
                    >
                      Update Status
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteRecord(item.ID)}
                      disabled={deletingId === item.ID}
                    >
                      {deletingId === item.ID ? 'Deleting...' : <i className="fas fa-trash"></i>}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };
  
  // Render update modal
  const renderUpdateModal = () => {
    if (!showUpdateModal) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Update Order Status</h3>
          
          <div className="form-group">
            <label htmlFor="updateStatus">Status:</label>
            <select
              id="updateStatus"
              className="form-control"
              value={updatedStatus}
              onChange={(e) => setUpdatedStatus(e.target.value)}
              required
            >
              <option value="">Select a Status</option>
              {statuses.map((status, index) => (
                <option key={index} value={status.ID}>
                  {status.Status || status.Name || "Status " + (index + 1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="modal-buttons">
            <button 
              className="btn cancel-btn"
              onClick={() => setShowUpdateModal(false)}
            >
              Cancel
            </button>
            <button 
              className="btn update-confirm-btn"
              onClick={handleStatusUpdate}
            >
              Update
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Render component
  return (
    <div>
      <h2 className="app-title">Edzola Order Management System</h2>
      
      {/* Error and success messages */}
      {error && (
        <div className="message-container error-message">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="message-container success-message">
          {successMessage}
        </div>
      )}
      
      {/* Loading spinner */}
      {isLoading && <div className="loader"></div>}
      
      {/* Tabs */}
      <div className="tabs">
        <div 
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          View Orders
        </div>
        <div 
          className={`tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          Add New Order
        </div>
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'list' ? renderOrderList() : renderForm()}
      </div>
      
      {/* Update modal */}
      {renderUpdateModal()}
    </div>
  );
}

export default OrderTrackingApp;
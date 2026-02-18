import React, { useState, useEffect } from 'react';
import UploadTab from './components/UploadTab.jsx';
import DashboardTab from './components/DashboardTab.jsx';
import DataTableTab from './components/DataTableTab.jsx';
import { loadSampleData } from './utils/sampleDataLoader.js';
import  ctsLogo from './assets/cts-logo.png';
import { Helmet } from "react-helmet";

function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedData, setUploadedData] = useState(null);
  const [lastUploadTime, setLastUploadTime] = useState(null);
  const [isSampleData, setIsSampleData] = useState(false);

  const tabs = [
    { id: 'upload', label: 'Upload File', icon: '📁' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'data-table', label: 'Data Table', icon: '📋' }
  ];

  useEffect(() => {
    const initializeData = async () => {
      if (!uploadedData) {
        try {
          const sampleData = await loadSampleData();
          if (sampleData) {
            setUploadedData(sampleData);
            setIsSampleData(true);
            setLastUploadTime(new Date());
          }
        } catch (error) {
          console.error('Failed to load sample data:', error);
        }
      }
    };
    initializeData();
  }, [uploadedData]);

  const handleDataUpload = (data) => {
    setUploadedData(data);
    setLastUploadTime(new Date());
    setIsSampleData(false);
  };

  return (
    <div className="App">

          <Helmet>
        <link rel="icon" type="image/png" href={ctsLogo} />
      </Helmet>

      <div className="header" id="app-header">
        <h1> 
          
          <span className="logoPng"><img src={ctsLogo} alt={ctsLogo}  /></span>

          Adobe Staffing Analytics Dashboard</h1>
        <p>Professional Data Analytics for Demand/Supply/TAG Pipeline Analysis</p>
      </div>

      {/* Main Container */}
      <div className="container">
        {/* Tab Navigation — mark as no-export so it never appears in captures */}
        <div className="tabs no-export">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'upload' && (
            <UploadTab
              onDataUpload={handleDataUpload}
              uploadedData={uploadedData}
              lastUploadTime={lastUploadTime}
              isSampleData={isSampleData}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardTab
              uploadedData={uploadedData}
              isSampleData={isSampleData}
            />
          )}

          {activeTab === 'data-table' && (
            <DataTableTab
              uploadedData={uploadedData}
              isSampleData={isSampleData}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
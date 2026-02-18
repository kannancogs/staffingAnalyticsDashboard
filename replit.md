# Cognizant Analytics Dashboard

## Overview

This is a React.js-based analytics dashboard designed for Cognizant's demand/supply/TAG pipeline analysis. The application provides a professional interface for uploading Excel files, processing data, and generating interactive visualizations with Cognizant's corporate branding and styling.

## User Preferences

Preferred communication style: Simple, everyday language.
Preferred framework: React.js with .jsx file extensions for better understanding.

## System Architecture

### Frontend Architecture
- **Framework**: React.js web application framework
- **File Structure**: Component-based architecture with .jsx extensions
- **Layout**: Modern tabbed interface with responsive design
- **Styling**: Custom CSS implementation with Cognizant brand colors and typography
- **Components**: Three main tabs for file upload, dashboard visualization, and data table view

### Component Structure
- **App.jsx**: Main application component with tab management and state
- **UploadTab.jsx**: File upload functionality with drag & drop support
- **DashboardTab.jsx**: Interactive dashboard with charts and KPIs
- **DataTableTab.jsx**: Data table with search, filter, and export functionality

### Data Processing Layer
- **File Handling**: Excel file processing using xlsx library in the browser
- **Data Transformation**: Client-side conversion from Excel sheets to JSON format
- **Data Cleaning**: Automated data cleaning and preparation utilities
- **Multi-sheet Support**: Processes all sheets within uploaded Excel files

### Visualization Engine
- **Charting Library**: Chart.js with react-chartjs-2 for interactive visualizations
- **Chart Types**: Line charts, bar charts, pie charts, and doughnut charts
- **Dashboard Components**: KPI metrics, trend analysis, and comparison charts
- **Color Scheme**: Consistent Cognizant brand color palette across all visualizations
- **Responsive Design**: Adaptive layouts for different screen sizes

### State Management
- **React State**: Local component state for managing uploaded data and UI state
- **Data Persistence**: In-memory data storage during session
- **File Tracking**: Upload timestamp tracking and file information
- **Tab Navigation**: Centralized tab state management

### Styling System
- **Theme Implementation**: Centralized CSS styling with Cognizant corporate identity
- **Custom Components**: Branded buttons, tabs, and layout elements
- **Typography**: Inter font family integration for professional appearance
- **Responsive Elements**: Hover effects, smooth transitions, and mobile-friendly design

## External Dependencies

### Core Libraries
- **react**: Core React library for component development
- **react-dom**: React DOM rendering
- **react-scripts**: Build tools and development server
- **xlsx**: Excel file reading and processing in the browser

### Visualization Libraries
- **chart.js**: Core charting library for data visualization
- **react-chartjs-2**: React wrapper for Chart.js integration

### Styling and Fonts
- **Google Fonts**: Inter font family for typography
- **CSS**: Custom styling implementation with Cognizant brand colors

### Build and Development
- **react-scripts**: Development server and build tools
- **browserslist**: Browser compatibility configuration
- **Node.js**: Runtime environment for development
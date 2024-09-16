# Wijmo REST API Sample

This project demonstrates Client & server-side implementations for Wijmo's RestCollectionView class in both Node.js and .NET Core 8.0.

## Features

- Paginated, sorted, and filtered data
- Grouped data support
- Sample data from JSON files

## Node.js Implementation

### Prerequisites
- Node.js (v14.x or later)
- npm

### Setup
1. Install dependencies: `npm install`
2. Run in production: `npm start`
3. Run in development: `npm run dev`
4. Access API: `http://localhost:4000/wwi/api/v1/purchaseorders`

## .NET Core Implementation

### Prerequisites
- .NET Core 8.0
- Visual Studio 2022

### Setup
1. Open `Mescius.Wijmo.Sample.Sln` in VS 2022
2. Build the project
3. Run the project (F5)
4. Access API: `http://localhost:5125`

## Usage

Both implementations can be consumed by Wijmo's RestCollectionView class from the `wijmo.rest` module.

![screenshot](https://github.com/user-attachments/assets/9b57f21c-1509-43d4-b12b-a42e1d5abcfc)


For detailed API documentation and additional configuration options, please refer to the individual project folders.

# Cutlist Processor

A React-based cutting list processor and optimizer for woodworking projects. This application helps woodworkers optimize material usage by calculating efficient cutting layouts for sheet materials.

## Features

- **Import cutting lists** from Polyboard/SketchUp exports
- **Material mapping** from generic names to supplier-specific materials
- **Cutting optimization** using advanced algorithms to minimize waste
- **Visual sheet layouts** showing optimal part placement
- **Stock sheet configuration** for different material types
- **Grain direction support** for wood grain considerations
- **Edge banding tracking** for parts requiring edge treatment
- **Milling calculations** for timber volume requirements

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cutlist-processor
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will open in your browser at `http://localhost:3000`.

## Usage

1. **Import Data**: Paste your cutting list data from Polyboard or SketchUp, or use the sample data to get started
2. **Configure Materials**: Map generic material names to your supplier's material names
3. **Set Stock Sheets**: Configure the dimensions of your available sheet materials
4. **Optimize**: The application automatically calculates optimal cutting layouts
5. **Review Results**: View the cutting diagrams and material requirements

## Technology Stack

- **React 18** - Frontend framework
- **Lucide React** - Icon library
- **TailwindCSS** - Styling framework
- **Custom Cutting Algorithm** - Guillotine-based optimization

## Project Structure

```
src/
├── CutlistProcessor.jsx    # Main application component
├── index.js               # Application entry point
└── index.css             # Global styles and Tailwind imports
```

## Configuration

The application includes several configurable parameters:

- **Default Stock Sheets**: Pre-configured sheet sizes for common materials
- **Material Mapping**: Map generic material codes to supplier names
- **Cutting Kerf**: Blade width for cutting calculations
- **Milling Configuration**: Parameters for timber processing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Author

Daniel Fredrick Onzimai (onzimai@dawin.group)

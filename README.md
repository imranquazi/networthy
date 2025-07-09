# Creator Dashboard

A unified dashboard for content creators to track revenue and analytics across multiple platforms including YouTube, Twitch, TikTok, Instagram, and Kick.

## 🚀 Features

- **Multi-Platform Revenue Tracking**: Monitor earnings from YouTube, Twitch, TikTok, Instagram, and Kick in one place
- **Real-time Analytics**: View revenue trends, growth metrics, and platform performance
- **Interactive Charts**: Beautiful visualizations using Recharts
- **Responsive Design**: Modern UI that works on desktop and mobile
- **Platform Icons**: Easy-to-recognize platform branding
- **Growth Metrics**: Track follower/subscriber growth across platforms

## 🛠️ Tech Stack

### Backend
- **Node.js** (v18+) with Express.js
- **ES Modules** for modern JavaScript
- **CORS** enabled for cross-origin requests
- **RESTful API** endpoints

### Frontend
- **Next.js 15** with TypeScript
- **React 19** with modern hooks
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons

## 📦 Installation

### Prerequisites
- Node.js v18 or higher
- npm v10 or higher

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd creator-dashboard
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install --legacy-peer-deps
   ```

## 🚀 Running the Application

### Start the Backend Server
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:4000`

### Start the Frontend Development Server
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

## 📊 API Endpoints

### Revenue Data
- `GET /api/revenue` - Returns revenue data for all platforms
- `GET /api/platforms` - Returns detailed platform statistics
- `GET /api/analytics` - Returns aggregated analytics data

### Authentication
- `GET /api/auth/status` - Returns authentication status

## 🎨 Dashboard Features

### Overview Cards
- **Total Revenue**: Combined earnings across all platforms
- **Growth Rate**: Overall growth percentage
- **Total Followers**: Combined follower/subscriber count
- **Total Views**: Combined view count across platforms

### Charts
- **Revenue Trend**: Line chart showing monthly revenue progression
- **Platform Breakdown**: Pie chart showing revenue distribution by platform

### Platform Performance Table
- Platform-specific metrics
- Follower/subscriber counts
- View/viewer statistics
- Revenue per platform
- Growth percentages

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
PORT=4000
```

### Adding New Platforms
To add support for new platforms:

1. Update the backend API endpoints in `backend/server.js`
2. Add platform icons in the frontend `getPlatformIcon` function
3. Update the data interfaces in `frontend/src/app/page.tsx`

## 🎯 Future Enhancements

- [ ] Real-time data integration with platform APIs
- [ ] User authentication and multi-user support
- [ ] Custom date range filtering
- [ ] Export functionality (PDF, CSV)
- [ ] Mobile app version
- [ ] Push notifications for revenue milestones
- [ ] Advanced analytics and predictions
- [ ] Integration with payment processors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Icons provided by [Lucide React](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)
- Built with [Next.js](https://nextjs.org/) and [Express.js](https://expressjs.com/) 
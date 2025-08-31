export default function Footer(){
  return (
    <footer className="mt-16 border-t border-white/10">
      <div className="container py-8 text-sm opacity-80">
        <p><strong>Rotehuegel Research Business Consultancy Private Limited</strong></p>
        <p>Registered Office: No. 1/584, 7th Street, Jothi Nagar, Padianallur, Near Gangaiamman Kovil, Redhills, Chennai – 600052, Tamil Nadu, India</p>
        <p>📧 <a href="mailto:sivakumar@rotehuegels.com">sivakumar@rotehuegels.com</a> • 📱 +91-90044-91275 • 🌐 <a href="https://www.rotehuegels.com">www.rotehuegels.com</a></p>
        <p className="mt-2">© {new Date().getFullYear()} Rotehuegels. All rights reserved.</p>
      </div>
    </footer>
  )
}

import { Link } from "react-router-dom"
import { useStore } from "../store"
import "./home.css"

export default function Home() {
  const { resetDemo, customers } = useStore()

  return (
    <main className="home">
      <div className="home-stripe" />
      <div className="home-shell">
        <section className="home-kiosk">
          <div className="home-brand">
            <img src={`${import.meta.env.BASE_URL}brand/clown-face.png`} alt="" />
            <span>
              <strong>CIRCUS LIQUOR</strong>
              <small>Since 1959 · California</small>
            </span>
          </div>
          <div className="home-copy">
            <p className="home-kicker">On the iPad</p>
            <h1>The stand</h1>
            <p>The guest fills this in. English or Spanish. Landscape, built for a large iPad.</p>
            <Link to="/kiosk" className="home-btn home-btn-light">
              Open the kiosk
            </Link>
          </div>
          <p className="home-foot">
            {customers.length} {customers.length === 1 ? "guest" : "guests"} in this browser
          </p>
          <img className="home-mascot" src={`${import.meta.env.BASE_URL}brand/mascot.png`} alt="" />
        </section>
        <section className="home-desk">
          <div />
          <div className="home-copy">
            <p className="home-kicker">In the office</p>
            <h1>The desk</h1>
            <p>Look up a guest, message everyone who drinks tequila, or everyone who drinks bourbon.</p>
            <Link to="/admin" className="home-btn home-btn-red">
              Open the dashboard
            </Link>
          </div>
          <button type="button" className="home-reset" onClick={resetDemo}>
            Reset sample data
          </button>
        </section>
      </div>
    </main>
  )
}

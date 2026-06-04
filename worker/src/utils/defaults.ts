export const DEFAULT_SECTIONS = {
  sections_index: JSON.stringify([
    {
      id: 'hero',
      type: 'hero',
      title: 'Hero Section',
      visible: true,
      content: {
        headline: 'A Home Away from<br />\n<span>Academia</span>',
        subtitle: 'The KSoM Guesthouse offers serene, well-appointed rooms on the Kerala School of Mathematics campus — the ideal base for visiting scholars, researchers, and faculty attending programmes at KSoM.',
        btn1_label: '🔑 Login to Book Rooms',
        btn2_label: 'View Room Status →'
      }
    },
    {
      id: 'stats',
      type: 'stats',
      title: 'Stats Banner',
      visible: true,
      content: {
        stat1_value: '5',
        stat1_label: 'Comfortable Rooms',
        stat2_value: '₹800',
        stat2_label: 'Starting Per Night',
        stat3_value: '24/7',
        stat3_label: 'Reception Support',
        stat4_value: 'Wi-Fi',
        stat4_label: 'High-Speed Campus Network'
      }
    },
    {
      id: 'rooms',
      type: 'rooms',
      title: 'Featured Rooms Header',
      visible: true,
      content: {
        label: 'Our Rooms',
        title: 'Accommodation for Every Need',
        subtitle: 'From private single rooms to spacious suites, all rooms are designed for scholarly comfort with modern amenities.'
      }
    },
    {
      id: 'why-choose-us',
      type: 'why-choose-us',
      title: 'Why Choose Us Section',
      visible: true,
      content: {
        label: 'Why Stay with Us',
        title: 'The KSoM Guesthouse Advantage',
        cards: [
          { icon: '🏛️', title: 'On-Campus Location', desc: 'Walk to lecture halls, libraries, and seminar rooms. No commute, just scholarship.' },
          { icon: '📶', title: 'High-Speed Internet', desc: 'Access the KSoM campus network for uninterrupted research and remote collaboration.' },
          { icon: '🌿', title: 'Serene Campus', desc: 'Nestled in Kerala\'s lush greenery — a peaceful environment perfect for deep focus.' },
          { icon: '💰', title: 'Affordable Rates', desc: 'Government-institute pricing — excellent value without compromising on comfort.' },
          { icon: '🔐', title: 'Safe & Secure', desc: '24/7 campus security, secure access, and dedicated reception support for all guests.' },
          { icon: '📋', title: 'Easy Booking', desc: 'Book online in minutes and receive your confirmation instantly — no paperwork.' }
        ]
      }
    },
    {
      id: 'contact-strip',
      type: 'contact-strip',
      title: 'Planning to Stay Banner',
      visible: true,
      content: {
        title: 'Planning to Stay at KSoM?',
        desc: 'Direct bookings are not permitted. Please contact your KSoM sponsor, coordinator, or supervisor to initiate a booking request.',
        btn1_label: '🔑 Login to Book Rooms',
        btn2_label: 'Contact Us'
      }
    }
  ]),
  sections_rooms: JSON.stringify([
    {
      id: 'page-hero',
      type: 'page-hero',
      title: 'Page Hero Header',
      visible: true,
      content: {
        label: 'Our Accommodation',
        title: 'Rooms & Tariff',
        subtitle: 'All rooms include AC, Wi-Fi, hot water, and daily housekeeping. Choose the option that best suits your stay.'
      }
    },
    {
      id: 'rooms-grid',
      type: 'rooms-grid',
      title: 'Rooms List Grid',
      visible: true,
      content: {}
    },
    {
      id: 'policies',
      type: 'policies',
      title: 'Stay Policies Section',
      visible: true,
      content: {
        label: 'Policies',
        title: 'Booking & Stay Policies',
        cards: [
          { title: '⏰ Check-in / Check-out', points: ['Check-in: 12:00 PM (noon)', 'Check-out: 11:00 AM', 'Early check-in subject to availability'] },
          { title: '💳 Payment', points: ['Payment at check-out', 'Cash, UPI, bank transfer accepted', 'Invoice provided on request'] },
          { title: '📋 Guest Eligibility', points: ['KSoM programme participants', 'Invited faculty & researchers', 'External guests: prior approval required'] }
        ]
      }
    }
  ]),
  sections_availability: JSON.stringify([
    {
      id: 'page-hero',
      type: 'page-hero',
      title: 'Page Hero Header',
      visible: true,
      content: {
        label: 'Plan Your Visit',
        title: 'Availability Calendar',
        subtitle: 'See which rooms are available for your preferred dates. Green = available, red = booked.'
      }
    },
    {
      id: 'calendar',
      type: 'calendar',
      title: 'Interactive Availability Grid',
      visible: true,
      content: {}
    }
  ]),
  sections_gallery: JSON.stringify([
    {
      id: 'page-hero',
      type: 'page-hero',
      title: 'Page Hero Header',
      visible: true,
      content: {
        label: 'Visual Tour',
        title: 'Photo Gallery',
        subtitle: 'A glimpse of our rooms, campus, and facilities at the KSoM Guesthouse.'
      }
    },
    {
      id: 'gallery',
      type: 'gallery',
      title: 'Gallery Masonry Grid',
      visible: true,
      content: {}
    },
    {
      id: 'cta',
      type: 'cta',
      title: 'Like What You See Banner',
      visible: true,
      content: {
        title: 'Like What You See?',
        subtitle: 'Book your stay at the KSoM Guesthouse and experience it in person.',
        btn_label: 'Book a Room →'
      }
    }
  ]),
  sections_contact: JSON.stringify([
    {
      id: 'page-hero',
      type: 'page-hero',
      title: 'Page Hero Header',
      visible: true,
      content: {
        label: 'Reach Us',
        title: 'Contact Us',
        subtitle: 'We\'re happy to assist with reservations, inquiries, or any other questions about your stay.'
      }
    },
    {
      id: 'contact-layout',
      type: 'contact-layout',
      title: 'Contact Form & Details',
      visible: true,
      content: {
        title: 'Get in Touch',
        hours_title: 'Office Hours',
        hours: [
          { days: 'Monday – Friday', hours: '9:00 AM – 5:00 PM', closed: false },
          { days: 'Saturday', hours: '9:00 AM – 1:00 PM', closed: false },
          { days: 'Sunday / Holidays', hours: 'Closed', closed: true }
        ],
        show_hours: true
      }
    },
    {
      id: 'map',
      type: 'map',
      title: 'Google Map Section',
      visible: true,
      content: {
        title: 'How to Reach Us'
      }
    }
  ]),
  contact_website: 'https://www.ksom.res.in'
};

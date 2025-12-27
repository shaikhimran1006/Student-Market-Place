/**
 * Seed script to create an admin user
 */

require('dotenv').config();
const connectDB = require('../config/database');
const { User, Product, Cart, Order } = require('../models');

const run = async () => {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@campus.edu';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';

  // Ensure admin exists (use save to trigger password hash)
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = new User({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isVerifiedStudent: true,
    });
    await admin.save();
  } else {
    admin.password = adminPassword; // reset & hash
    await admin.save();
  }
  console.log('✅ Admin ready:', admin.email);

  // Seed a verified seller (hashed password)
  const sellerEmail = 'seller@campus.edu';
  let seller = await User.findOne({ email: sellerEmail });
  if (!seller) {
    seller = new User({
      name: 'Campus Seller',
      email: sellerEmail,
      password: 'Seller123',
      role: 'seller',
      isVerifiedStudent: true,
      sellerStatus: 'approved',
      sellerApplication: {
        businessName: 'Campus Deals',
        description: 'Trusted campus marketplace seller',
        appliedAt: new Date(),
        reviewedAt: new Date(),
        reviewedBy: admin._id,
      },
    });
    await seller.save();
  } else {
    seller.password = 'Seller123';
    seller.role = 'seller';
    seller.isVerifiedStudent = true;
    seller.sellerStatus = 'approved';
    seller.sellerApplication = {
      businessName: 'Campus Deals',
      description: 'Trusted campus marketplace seller',
      appliedAt: new Date(),
      reviewedAt: new Date(),
      reviewedBy: admin._id,
    };
    await seller.save();
  }
  console.log('✅ Seller ready:', seller.email);

  // Clean bad seed attempts (null slug)
  await Product.deleteMany({ slug: null });

  // Seed sample products
  const sampleProducts = [
    {
      title: 'Lenovo ThinkPad X1 Carbon (i7, 16GB, 512GB)',
      description: 'Lightweight, durable laptop perfect for CS majors. Excellent battery life, clean install.',
      price: 850,
      category: 'electronics',
      productType: 'physical',
      stock: 5,
      condition: 'like-new',
      images: [
        { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', alt: 'Laptop', isPrimary: true },
      ],
    },
    {
      title: 'Noise-Cancelling Headphones (Sony WH-1000XM5)',
      description: 'Flagship ANC headphones for quiet study sessions and Zoom calls. Includes case and cable.',
      price: 310,
      category: 'electronics',
      productType: 'physical',
      stock: 4,
      condition: 'like-new',
      images: [
        { url: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?auto=format&fit=crop&w=900&q=80', alt: 'Headphones', isPrimary: true },
      ],
    },
    {
      title: 'iPad Air + Pencil (10.9")',
      description: 'Great for note-taking and sketching. Includes Apple Pencil. Minor scratches on back.',
      price: 420,
      category: 'electronics',
      productType: 'physical',
      stock: 3,
      condition: 'good',
      images: [
        { url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=80', alt: 'iPad', isPrimary: true },
      ],
    },
    {
      title: 'Desk Essentials Bundle',
      description: 'Metal laptop stand, LED desk lamp, and cable organizer. Perfect dorm setup upgrade.',
      price: 60,
      category: 'electronics',
      productType: 'physical',
      stock: 10,
      condition: 'good',
      images: [
        { url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80', alt: 'Desk bundle', isPrimary: true },
      ],
    },
    {
      title: 'Data Structures & Algorithms (PDF)',
      description: 'Comprehensive PDF for interview prep with worked examples and cheat sheets. Lifetime access.',
      price: 19,
      category: 'study-materials',
      productType: 'digital',
      stock: 999,
      digitalDetails: {
        fileUrl: 'https://example.com/dsa.pdf',
        fileType: 'application/pdf',
        fileSize: 2_000_000,
        downloadLimit: -1,
      },
      images: [
        { url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80', alt: 'Study PDF', isPrimary: true },
      ],
    },
    {
      title: 'AI Resume & Cover Letter Kit (Notion)',
      description: 'ATS-friendly resume + cover letter templates with AI prompts tailored for internships and grad jobs.',
      price: 15,
      category: 'study-materials',
      productType: 'digital',
      stock: 999,
      digitalDetails: {
        fileUrl: 'https://example.com/resume-kit.zip',
        fileType: 'application/zip',
        fileSize: 4_000_000,
        downloadLimit: -1,
      },
      images: [
        { url: 'https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=900&q=80', alt: 'Resume kit', isPrimary: true },
      ],
    },
    {
      title: 'Campus Fest Weekend Pass',
      description: 'Access to all events, concerts, and workshops. Digital QR delivery after purchase.',
      price: 75,
      category: 'event-passes',
      productType: 'digital',
      stock: 200,
      digitalDetails: {
        fileUrl: 'https://example.com/campus-pass.pdf',
        fileType: 'application/pdf',
        fileSize: 500_000,
        downloadLimit: 2,
      },
      images: [
        { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', alt: 'Event pass', isPrimary: true },
      ],
    },
    {
      title: 'Ultimate Finals Survival Pack',
      description: 'Noise machine, blue-light glasses, and hydration kit to survive finals week. Pickup only.',
      price: 55,
      category: 'electronics',
      productType: 'physical',
      stock: 6,
      condition: 'good',
      images: [
        { url: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&w=900&q=80', alt: 'Finals pack', isPrimary: true },
      ],
    },
    {
      title: 'Premium Study Subscriptions (6 months)',
      description: 'Shared subscription slot for online learning library. Includes 6 months access.',
      price: 49,
      category: 'subscriptions',
      productType: 'digital',
      stock: 50,
      images: [
        { url: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=800&q=80', alt: 'Subscription', isPrimary: true },
      ],
    },
    {
      title: 'Dorm Coffee Starter Kit',
      description: 'Compact pour-over setup with reusable filter and starter beans. Fits tiny dorm desks.',
      price: 38,
      category: 'electronics',
      productType: 'physical',
      stock: 12,
      condition: 'like-new',
      images: [
        { url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80', alt: 'Coffee kit', isPrimary: true },
      ],
    },
    {
      title: 'Mechanical Keyboard (Hot-swap, Brown switches)',
      description: 'Compact 75% layout, RGB, includes USB-C cable. Perfect for dorm desk.',
      price: 95,
      category: 'electronics',
      productType: 'physical',
      stock: 7,
      condition: 'like-new',
      images: [
        { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', alt: 'Keyboard', isPrimary: true },
      ],
    },
  ];

  for (const p of sampleProducts) {
    const existing = await Product.findOne({ title: p.title });
    if (existing) continue;

    const product = new Product({
      ...p,
      seller: seller._id,
      status: 'active',
      isPublished: true,
    });
    await product.save(); // triggers slug generation
  }

  console.log(`✅ Seeded ${sampleProducts.length} products`);

  // Seed a fully-filled demo student
  const studentEmail = 'student@campus.edu';
  let student = await User.findOne({ email: studentEmail });
  if (!student) {
    student = new User({
      name: 'Demo Student',
      email: studentEmail,
      password: 'Student123',
      role: 'student',
      isVerifiedStudent: true,
      studentId: 'STU-2025-042',
      college: 'Mercer University',
      phone: '+1-555-0142',
      avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
      address: {
        street: '123 Dorm Way',
        city: 'Macon',
        state: 'GA',
        zipCode: '31201',
        country: 'USA',
      },
    });
    await student.save();
  } else {
    student.password = 'Student123';
    student.isVerifiedStudent = true;
    student.studentId = 'STU-2025-042';
    student.college = 'Mercer University';
    student.phone = '+1-555-0142';
    student.address = {
      street: '123 Dorm Way',
      city: 'Macon',
      state: 'GA',
      zipCode: '31201',
      country: 'USA',
    };
    await student.save();
  }
  console.log('✅ Demo student ready:', student.email);

  // Prefill cart for demo student
  const [onePhysical, oneDigital] = await Promise.all([
    Product.findOne({ productType: 'physical' }),
    Product.findOne({ productType: 'digital' }),
  ]);

  const cart = await Cart.getOrCreateCart(student._id);
  cart.items = [];
  cart.coupon = undefined;
  if (onePhysical) {
    cart.items.push({ product: onePhysical._id, quantity: 1, price: onePhysical.price });
  }
  if (oneDigital) {
    cart.items.push({ product: oneDigital._id, quantity: 1, price: oneDigital.price });
  }
  await cart.save();
  console.log('✅ Demo cart prepared with starter items');

  // Create a showcase order for the demo student
  if (onePhysical && oneDigital) {
    const orderItems = [
      {
        product: onePhysical._id,
        productSnapshot: {
          title: onePhysical.title,
          price: onePhysical.price,
          image: onePhysical.images?.[0]?.url,
          productType: onePhysical.productType,
          seller: onePhysical.seller,
        },
        quantity: 1,
        price: onePhysical.price,
      },
      {
        product: oneDigital._id,
        productSnapshot: {
          title: oneDigital.title,
          price: oneDigital.price,
          image: oneDigital.images?.[0]?.url,
          productType: oneDigital.productType,
          seller: oneDigital.seller,
        },
        quantity: 1,
        price: oneDigital.price,
        digitalAccess: {
          isUnlocked: true,
          downloadLimit: oneDigital.digitalDetails?.downloadLimit || -1,
        },
      },
    ];

    const pricingSubtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = new Order({
      orderNumber: 'SEED-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      customer: student._id,
      items: orderItems,
      pricing: {
        subtotal: pricingSubtotal,
        shipping: 5,
        tax: Math.round(pricingSubtotal * 0.07 * 100) / 100,
        discount: 0,
        total: Math.round((pricingSubtotal + 5 + pricingSubtotal * 0.07) * 100) / 100,
      },
      shippingAddress: student.address,
      status: 'processing',
      payment: {
        method: 'card',
        status: 'completed',
        transactionId: 'DEMO-TXN-' + Date.now().toString(36),
        paidAt: new Date(),
      },
      timeline: [
        { status: 'confirmed', title: 'Order confirmed', description: 'Seller preparing your order', timestamp: new Date() },
        { status: 'processing', title: 'Packing items', description: 'Physical item being packed', timestamp: new Date() },
      ],
      shipping: {
        carrier: 'Campus Courier',
        trackingNumber: 'CC-' + Math.random().toString(36).substring(2, 8).toUpperCase(),
        method: 'express',
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      orderType: 'mixed',
      customerNotes: 'Leave at front desk if not home.',
      metadata: {
        source: 'web',
        userAgent: 'seed-script',
      },
    });

    await order.save();
    console.log('✅ Demo order created for student');
  } else {
    console.log('ℹ️ Skipped demo order (missing physical or digital product)');
  }

  console.log('Done.');
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

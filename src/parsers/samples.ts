export const SAMPLE_SQL = `-- E-Commerce Relational Schema
CREATE TABLE users (
  id INT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

CREATE TABLE categories (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) UNIQUE,
  parent_id INT REFERENCES categories(id)
);

CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  category_id INT REFERENCES categories(id),
  created_at TIMESTAMP
);

CREATE TABLE orders (
  id INT PRIMARY KEY,
  user_id INT REFERENCES users(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  order_date TIMESTAMP
);

CREATE TABLE order_items (
  id INT PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  product_id INT REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL
);
`;

export const SAMPLE_JSON = `{
  "store": {
    "name": "Nova Cyber Gear",
    "domain": "novagear.io",
    "isActive": true,
    "settings": {
      "currency": "USD",
      "taxRate": 0.08,
      "notifications": {
        "email": true,
        "slack": false
      }
    },
    "featuredProducts": [
      {
        "sku": "KB-900",
        "name": "Cybernetic Mechanical Keyboard",
        "price": 189.99,
        "tags": ["gaming", "wireless", "rgb"]
      },
      {
        "sku": "MO-450",
        "name": "Precision Ergonomic Mouse",
        "price": 79.50,
        "tags": ["office", "wireless"]
      }
    ],
    "manager": {
      "name": "Alex Chen",
      "contact": {
        "email": "alex@novagear.io",
        "phone": "+1-555-0199"
      }
    }
  }
}`;

export const SAMPLE_CSV = `customer_id,name,email,plan_tier,monthly_spend,signup_date,is_churned
101,Sarah Connor,sarah@resistance.ai,Enterprise,1250.00,2024-01-15,false
102,John Matrix,j.matrix@commando.io,Pro,249.50,2024-02-10,false
103,Ellen Ripley,ripley@nostromo.org,Enterprise,1890.00,2024-02-18,false
104,Rick Deckard,deckard@blade.run,Starter,49.00,2024-03-01,true
105,Neo Anderson,thomas@matrix.net,Pro,249.50,2024-03-12,false
`;


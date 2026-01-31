<?php
declare(strict_types=1);

if (!defined('DB_HOST'))    define('DB_HOST', '127.0.0.1');
if (!defined('DB_NAME'))    define('DB_NAME', 'booking_app');  // <-- a te DB neved
if (!defined('DB_USER'))    define('DB_USER', 'root');
if (!defined('DB_PASS'))    define('DB_PASS', '');
if (!defined('DB_CHARSET')) define('DB_CHARSET', 'utf8mb4');

if (!defined('ALLOWED_ORIGINS')) {
  define('ALLOWED_ORIGINS', [
    'http://127.0.0.1:5173',
    'http://localhost:5173',
  ]);
}

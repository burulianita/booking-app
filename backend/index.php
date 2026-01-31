<?php
declare(strict_types=1);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';


$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && defined('ALLOWED_ORIGINS') && in_array($origin, ALLOWED_ORIGINS, true)) {
  header("Access-Control-Allow-Origin: $origin");
  header("Vary: Origin");
}
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=utf-8");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}


function respond($data, int $code = 200): void {
  http_response_code($code);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function json_input(): array {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}


function route_path(): string {
  
  if (!empty($_GET['route'])) {
    $p = (string)$_GET['route'];
    if ($p === '') return '/';
    return $p[0] === '/' ? $p : "/$p";
  }

 
  if (!empty($_SERVER['PATH_INFO'])) {
    return (string)$_SERVER['PATH_INFO'];
  }


  $uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
  $uri = explode('?', $uri, 2)[0]; 

  $script = (string)($_SERVER['SCRIPT_NAME'] ?? ''); 

  if ($script !== '' && str_starts_with($uri, $script)) {
    $rest = substr($uri, strlen($script)); 
    return $rest !== '' ? $rest : '/';
  }

 
  return '/';
}

function time_add_minutes(string $timeHHMM, int $minutes): string {
  $dt = DateTime::createFromFormat('H:i', $timeHHMM);
  if (!$dt) return $timeHHMM;
  $dt->modify("+{$minutes} minutes");
  return $dt->format('H:i');
}

function overlaps(string $aStart, string $aEnd, string $bStart, string $bEnd): bool {
  return ($aStart < $bEnd) && ($bStart < $aEnd);
}

$pdo = db();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = route_path();


if ($method === 'GET' && isset($_GET['ping'])) {
  header("Content-Type: text/plain; charset=utf-8");
  echo "OK - backend index.php running";
  exit;
}

if ($method === 'GET' && isset($_GET['debug'])) {
  try {
    $colsBookings = $pdo->query("SHOW COLUMNS FROM bookings")->fetchAll();
    $colsItems    = $pdo->query("SHOW COLUMNS FROM booking_items")->fetchAll();
    $colsServices = $pdo->query("SHOW COLUMNS FROM services")->fetchAll();
    $colsSlots    = $pdo->query("SHOW COLUMNS FROM timeslots")->fetchAll();

    respond([
      'path' => $path,
      'bookings_columns' => $colsBookings,
      'booking_items_columns' => $colsItems,
      'services_columns' => $colsServices,
      'timeslots_columns' => $colsSlots,
    ]);
  } catch (Throwable $e) {
    respond(['error' => $e->getMessage(), 'path' => $path], 500);
  }
}


if ($method === 'GET' && $path === '/services') {
  $stmt = $pdo->query("
    SELECT id, name, duration_min, price
    FROM services
    WHERE active = 1
    ORDER BY id ASC
  ");
  respond(['services' => $stmt->fetchAll()]);
}


if ($method === 'GET' && $path === '/slots') {
  $date = (string)($_GET['date'] ?? '');
  $durationMin = (int)($_GET['duration_min'] ?? 0);

  if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    respond(['error' => 'Invalid date. Use YYYY-MM-DD'], 400);
  }
  if ($durationMin <= 0) $durationMin = 30;

  $open = '09:00';
  $close = '17:00';

  $stmt = $pdo->prepare("
    SELECT 
      b.id AS booking_id,
      b.start_time AS start_time,
      COALESCE(SUM(s.duration_min * bi.qty), 0) AS dur_min
    FROM bookings b
    JOIN booking_items bi ON bi.booking_id = b.id
    JOIN services s ON s.id = bi.service_id
    WHERE b.slot_date = ?
    GROUP BY b.id, b.start_time
    ORDER BY b.start_time ASC
  ");
  $stmt->execute([$date]);

  $booked = [];
  foreach ($stmt->fetchAll() as $r) {
    $bStart = substr((string)$r['start_time'], 0, 5);
    $dur = (int)$r['dur_min'];
    if ($dur <= 0) $dur = 15;
    $bEnd = time_add_minutes($bStart, $dur);
    $booked[] = ['start' => $bStart, 'end' => $bEnd];
  }

  $slots = [];
  for ($t = $open; $t < $close; $t = time_add_minutes($t, 15)) {
    $end = time_add_minutes($t, $durationMin);
    if ($end > $close) break;

    $ok = true;
    foreach ($booked as $b) {
      if (overlaps($t, $end, $b['start'], $b['end'])) {
        $ok = false;
        break;
      }
    }
    if ($ok) $slots[] = $t;
  }

  respond(['slots' => $slots]);
}


if ($method === 'POST' && $path === '/bookings') {
  $data = json_input();

  $name  = trim((string)($data['name'] ?? ''));
  $email = trim((string)($data['email'] ?? ''));
  $date  = (string)($data['date'] ?? '');
  $start = (string)($data['start_time'] ?? '');
  $items = $data['items'] ?? [];

  if ($name === '' || $email === '') respond(['error' => 'Name and email required'], 400);
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) respond(['error' => 'Invalid email'], 400);
  if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) respond(['error' => 'Invalid date'], 400);
  if (!preg_match('/^\d{2}:\d{2}$/', $start)) respond(['error' => 'Invalid start_time'], 400);
  if (!is_array($items) || count($items) === 0) respond(['error' => 'Cart is empty'], 400);

  
  $serviceIds = [];
  foreach ($items as $it) {
    $sid = (int)($it['serviceId'] ?? 0);
    if ($sid > 0) $serviceIds[] = $sid;
  }
  $serviceIds = array_values(array_unique($serviceIds));
  if (count($serviceIds) === 0) respond(['error' => 'Invalid items'], 400);


  $in = implode(',', array_fill(0, count($serviceIds), '?'));
  $stmt = $pdo->prepare("
    SELECT id, name, duration_min, price
    FROM services
    WHERE active = 1 AND id IN ($in)
  ");
  $stmt->execute($serviceIds);
  $services = $stmt->fetchAll();

  $map = [];
  foreach ($services as $s) $map[(int)$s['id']] = $s;

  
  $totalPrice = 0;
  $totalDuration = 0;
  $norm = [];

  foreach ($items as $it) {
    $sid = (int)($it['serviceId'] ?? 0);
    $qty = max(1, (int)($it['qty'] ?? 1));
    if (!$sid || !isset($map[$sid])) continue;

    $unit = (int)$map[$sid]['price'];
    $dur  = (int)$map[$sid]['duration_min'];
    $sname = (string)$map[$sid]['name'];

    $totalPrice += $unit * $qty;
    $totalDuration += $dur * $qty;

    $norm[] = [
      'service_id' => $sid,
      'service_name' => $sname,
      'price' => $unit,
      'qty' => $qty
    ];
  }

  if (count($norm) === 0) respond(['error' => 'No valid active services in cart'], 400);


  $end = time_add_minutes($start, $totalDuration);

  $stmt = $pdo->prepare("
    SELECT 
      b.start_time AS start_time,
      COALESCE(SUM(s.duration_min * bi.qty), 0) AS dur_min
    FROM bookings b
    JOIN booking_items bi ON bi.booking_id = b.id
    JOIN services s ON s.id = bi.service_id
    WHERE b.slot_date = ?
    GROUP BY b.id, b.start_time
  ");
  $stmt->execute([$date]);

  foreach ($stmt->fetchAll() as $b) {
    $bStart = substr((string)$b['start_time'], 0, 5);
    $bDur = (int)$b['dur_min'];
    if ($bDur <= 0) $bDur = 15;
    $bEnd = time_add_minutes($bStart, $bDur);

    if (overlaps($start, $end, $bStart, $bEnd)) {
      respond(['error' => 'Selected slot is no longer available'], 409);
    }
  }

  $pdo->beginTransaction();
  try {
    $stmt = $pdo->prepare("
      INSERT INTO bookings (customer_name, email, slot_date, start_time, total)
      VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$name, $email, $date, $start, $totalPrice]);

    $bookingId = (int)$pdo->lastInsertId();

    $stmtItem = $pdo->prepare("
      INSERT INTO booking_items (booking_id, service_id, service_name, price, qty)
      VALUES (?, ?, ?, ?, ?)
    ");

    foreach ($norm as $ni) {
      $stmtItem->execute([$bookingId, $ni['service_id'], $ni['service_name'], $ni['price'], $ni['qty']]);
    }

    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    respond(['error' => 'DB error', 'detail' => $e->getMessage()], 500);
  }

  respond([
    'ok' => true,
    'booking_id' => $bookingId,
    'payable' => $totalPrice,
    'end_time' => $end
  ]);
}

respond(['error' => 'Not found', 'path' => $path], 404);

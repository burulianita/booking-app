<?php
declare(strict_types=1);

require_once __DIR__ . '/db.php';

$pdo = db();

$pdo->exec("UPDATE services SET active=1");

echo "seed done";

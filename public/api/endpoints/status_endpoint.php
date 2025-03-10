
<?php
// Status endpoint handler

function handleStatusEndpoint() {
    echo json_encode([
        'status' => 'ok',
        'version' => '1.0.0',
        'timestamp' => date('c')
    ]);
    logApiRequest('status', 'success');
}

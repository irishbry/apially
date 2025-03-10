
<?php
// Start session for user authentication
session_start();

// Basic routing to determine which page to show
$page = isset($_GET['page']) ? $_GET['page'] : 'home';

// Check if user is logged in for protected pages
$loggedIn = isset($_SESSION['user']);
$protectedPages = ['sources', 'schema', 'data', 'settings'];

// Redirect to login if trying to access protected page while not logged in
if (in_array($page, $protectedPages) && !$loggedIn) {
    header('Location: index.php?page=login');
    exit;
}

// Set base variables for templates
$pageTitle = "CSV Consolidator Portal";
$baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/svg+xml" href="/favicon.ico">
    <title><?php echo $pageTitle; ?></title>
    <link rel="stylesheet" href="/styles.css">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 text-gray-900">
    <div id="app">
        <?php include_once("templates/header.php"); ?>
        
        <main class="container mx-auto px-4 py-8">
            <?php
            // Include the appropriate page content based on the route
            switch ($page) {
                case 'login':
                    include_once("templates/login.php");
                    break;
                case 'sources':
                    include_once("templates/sources.php");
                    break;
                case 'schema':
                    include_once("templates/schema.php");
                    break;
                case 'data':
                    include_once("templates/data.php");
                    break;
                case 'settings':
                    include_once("templates/settings.php");
                    break;
                case 'deploy':
                    include_once("templates/deploy.php");
                    break;
                case 'install':
                    include_once("templates/install.php");
                    break;
                default:
                    include_once("templates/home.php");
                    break;
            }
            ?>
        </main>
        
        <?php include_once("templates/footer.php"); ?>
    </div>
    
    <!-- Toasts container for notifications -->
    <div id="toast-container" class="fixed top-4 right-4 z-50"></div>
    
    <!-- Main JavaScript -->
    <script src="/js/app.js"></script>
    <?php
    // Include page-specific JavaScript if it exists
    if (file_exists("js/pages/{$page}.js")) {
        echo "<script src=\"/js/pages/{$page}.js\"></script>";
    }
    ?>
</body>
</html>

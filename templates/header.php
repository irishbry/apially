
<header class="header">
    <div class="container header-container">
        <div class="logo">CSV Consolidator</div>
        
        <nav class="nav">
            <?php if ($loggedIn): ?>
                <a href="index.php?page=sources" class="nav-item <?php echo $page === 'sources' ? 'active' : ''; ?>">Sources</a>
                <a href="index.php?page=schema" class="nav-item <?php echo $page === 'schema' ? 'active' : ''; ?>">Schema</a>
                <a href="index.php?page=data" class="nav-item <?php echo $page === 'data' ? 'active' : ''; ?>">Data</a>
                <a href="index.php?page=settings" class="nav-item <?php echo $page === 'settings' ? 'active' : ''; ?>">Settings</a>
                <a href="index.php?page=deploy" class="nav-item <?php echo $page === 'deploy' ? 'active' : ''; ?>">Deploy</a>
                <a href="#" id="logout-button" class="nav-item">Logout</a>
            <?php else: ?>
                <a href="index.php?page=login" class="nav-item <?php echo $page === 'login' ? 'active' : ''; ?>">Login</a>
                <a href="index.php?page=install" class="nav-item <?php echo $page === 'install' ? 'active' : ''; ?>">Install</a>
            <?php endif; ?>
        </nav>
    </div>
</header>

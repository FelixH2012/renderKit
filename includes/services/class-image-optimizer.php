<?php
/**
 * Image Optimizer
 *
 * Automatically optimizes uploaded images to reduce file size.
 * Perfect for users who upload large images from phones/cameras.
 *
 * @package RenderKit
 */

declare(strict_types=1);

namespace RenderKit;

/**
 * Automatic image optimization on upload
 */
class ImageOptimizer {

    /**
     * Maximum width for optimized images
     */
    private const MAX_WIDTH = 2400;

    /**
     * Maximum height for optimized images
     */
    private const MAX_HEIGHT = 2400;

    /**
     * JPEG quality (0-100)
     */
    private const JPEG_QUALITY = 82;

    /**
     * WebP quality (0-100)
     */
    private const WEBP_QUALITY = 80;

    /**
     * Max file size in bytes (1MB)
     */
    private const MAX_FILE_SIZE = 1048576;

    /**
     * Initialize hooks
     */
    public function init(): void {
        // Hook into upload process
        add_filter('wp_handle_upload', [$this, 'optimize_on_upload'], 10, 2);
        
        // Add custom image sizes for products
        add_action('after_setup_theme', [$this, 'register_image_sizes']);
        
        // Filter attachment metadata to include optimization info and generate WebP
        add_filter('wp_generate_attachment_metadata', [$this, 'optimize_thumbnails'], 10, 2);
        add_filter('wp_generate_attachment_metadata', [$this, 'generate_webp_versions'], 15, 2);
        
        // Add admin notice for optimization stats
        add_action('admin_notices', [$this, 'show_optimization_notice']);
        add_action('admin_notices', [$this, 'show_webp_regenerated_notice']);
        
        // Serve WebP images when supported
        add_filter('wp_get_attachment_image_src', [$this, 'maybe_serve_webp'], 10, 4);
        add_filter('wp_calculate_image_srcset', [$this, 'add_webp_srcset'], 10, 5);
        
        // Add regenerate WebP button to admin bar
        add_action('admin_bar_menu', [$this, 'add_regenerate_webp_button'], 101);
        add_action('admin_post_rk_regenerate_webp', [$this, 'handle_regenerate_webp']);
    }

    /**
     * Register custom image sizes for products
     */
    public function register_image_sizes(): void {
        add_image_size('rk-product-card', 600, 600, true);
        add_image_size('rk-product-hero', 1200, 1200, true);
        add_image_size('rk-product-thumb', 300, 300, true);
    }

    /**
     * Optimize image on upload
     */
    public function optimize_on_upload(array $upload, string $context): array {
        // Only process images
        $mime_types = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($upload['type'], $mime_types)) {
            return $upload;
        }

        $file_path = $upload['file'];
        $original_size = filesize($file_path);

        // Skip if already small enough
        if ($original_size < self::MAX_FILE_SIZE) {
            return $upload;
        }

        // Check for image manipulation support
        if (!$this->has_image_support()) {
            return $upload;
        }

        try {
            $optimized = $this->optimize_image($file_path, $upload['type']);
            
            if ($optimized) {
                $new_size = filesize($file_path);
                $savings = round((1 - $new_size / $original_size) * 100);
                
                // Store optimization stats in session for admin notice
                if (!session_id()) {
                    @session_start();
                }
                $_SESSION['rk_image_optimized'] = [
                    'original' => $this->format_bytes($original_size),
                    'optimized' => $this->format_bytes($new_size),
                    'savings' => $savings,
                ];
            }
        } catch (\Exception $e) {
            error_log('RenderKit Image Optimizer: ' . $e->getMessage());
        }

        return $upload;
    }

    /**
     * Optimize the image file
     */
    private function optimize_image(string $file_path, string $mime_type): bool {
        // Get image dimensions
        $info = getimagesize($file_path);
        if (!$info) {
            return false;
        }

        [$width, $height] = $info;

        // Calculate new dimensions if needed
        $new_width = $width;
        $new_height = $height;

        if ($width > self::MAX_WIDTH || $height > self::MAX_HEIGHT) {
            $ratio = min(self::MAX_WIDTH / $width, self::MAX_HEIGHT / $height);
            $new_width = (int) ($width * $ratio);
            $new_height = (int) ($height * $ratio);
        }

        // Use Imagick if available (better quality)
        if (extension_loaded('imagick')) {
            return $this->optimize_with_imagick($file_path, $mime_type, $new_width, $new_height);
        }

        // Fall back to GD
        if (extension_loaded('gd')) {
            return $this->optimize_with_gd($file_path, $mime_type, $new_width, $new_height);
        }

        return false;
    }

    /**
     * Optimize using Imagick
     */
    private function optimize_with_imagick(string $file_path, string $mime_type, int $width, int $height): bool {
        $image = new \Imagick($file_path);

        // Auto-orient based on EXIF
        $image->autoOrient();

        // Resize if needed
        $current_width = $image->getImageWidth();
        $current_height = $image->getImageHeight();

        if ($current_width !== $width || $current_height !== $height) {
            $image->resizeImage($width, $height, \Imagick::FILTER_LANCZOS, 1);
        }

        // Strip metadata to reduce size
        $image->stripImage();

        // Set compression based on type
        if ($mime_type === 'image/jpeg') {
            $image->setImageCompression(\Imagick::COMPRESSION_JPEG);
            $image->setImageCompressionQuality(self::JPEG_QUALITY);
        } elseif ($mime_type === 'image/png') {
            // Convert large PNGs to JPEG if no transparency
            if (!$image->getImageAlphaChannel()) {
                $image->setImageFormat('jpeg');
                $image->setImageCompressionQuality(self::JPEG_QUALITY);
                $new_path = preg_replace('/\.png$/i', '.jpg', $file_path);
                $image->writeImage($new_path);
                $image->destroy();
                // Replace file
                unlink($file_path);
                rename($new_path, $file_path);
                return true;
            }
        }

        // Optimize for web
        $image->setInterlaceScheme(\Imagick::INTERLACE_PLANE);

        // Write optimized image
        $image->writeImage($file_path);
        $image->destroy();

        return true;
    }

    /**
     * Optimize using GD
     */
    private function optimize_with_gd(string $file_path, string $mime_type, int $width, int $height): bool {
        // Load image based on type
        switch ($mime_type) {
            case 'image/jpeg':
                $source = imagecreatefromjpeg($file_path);
                break;
            case 'image/png':
                $source = imagecreatefrompng($file_path);
                break;
            case 'image/webp':
                $source = imagecreatefromwebp($file_path);
                break;
            default:
                return false;
        }

        if (!$source) {
            return false;
        }

        // Get current dimensions
        $current_width = imagesx($source);
        $current_height = imagesy($source);

        // Create new image with target dimensions
        if ($current_width !== $width || $current_height !== $height) {
            $resized = imagecreatetruecolor($width, $height);

            // Preserve transparency for PNG
            if ($mime_type === 'image/png') {
                imagesavealpha($resized, true);
                $transparent = imagecolorallocatealpha($resized, 0, 0, 0, 127);
                imagefill($resized, 0, 0, $transparent);
            }

            // Resize
            imagecopyresampled($resized, $source, 0, 0, 0, 0, $width, $height, $current_width, $current_height);
            imagedestroy($source);
            $source = $resized;
        }

        // Save optimized image
        switch ($mime_type) {
            case 'image/jpeg':
                $result = imagejpeg($source, $file_path, self::JPEG_QUALITY);
                break;
            case 'image/png':
                // PNG compression 0-9 (9 is max compression)
                $result = imagepng($source, $file_path, 8);
                break;
            case 'image/webp':
                $result = imagewebp($source, $file_path, self::WEBP_QUALITY);
                break;
            default:
                $result = false;
        }

        imagedestroy($source);
        return $result;
    }

    /**
     * Optimize generated thumbnails
     */
    public function optimize_thumbnails(array $metadata, int $attachment_id): array {
        if (empty($metadata['sizes'])) {
            return $metadata;
        }

        $upload_dir = wp_upload_dir();
        $base_dir = trailingslashit($upload_dir['basedir']);
        
        if (!empty($metadata['file'])) {
            $base_dir .= trailingslashit(dirname($metadata['file']));
        }

        foreach ($metadata['sizes'] as $size => $data) {
            $file_path = $base_dir . $data['file'];
            
            if (file_exists($file_path)) {
                $mime = $data['mime-type'] ?? 'image/jpeg';
                $this->compress_file($file_path, $mime);
            }
        }

        return $metadata;
    }

    /**
     * Compress a single file
     */
    private function compress_file(string $file_path, string $mime_type): void {
        if (!file_exists($file_path)) {
            return;
        }

        // Only compress larger files
        if (filesize($file_path) < 50000) { // 50KB
            return;
        }

        if (extension_loaded('imagick')) {
            try {
                $image = new \Imagick($file_path);
                $image->stripImage();
                
                if ($mime_type === 'image/jpeg') {
                    $image->setImageCompressionQuality(self::JPEG_QUALITY);
                }
                
                $image->writeImage($file_path);
                $image->destroy();
            } catch (\Exception $e) {
                // Silently fail
            }
        }
    }

    /**
     * Show optimization notice in admin
     */
    public function show_optimization_notice(): void {
        if (!session_id()) {
            @session_start();
        }

        if (empty($_SESSION['rk_image_optimized'])) {
            return;
        }

        $stats = $_SESSION['rk_image_optimized'];
        unset($_SESSION['rk_image_optimized']);

        ?>
        <div class="notice notice-success is-dismissible" style="border-left-color: #B8975A;">
            <p>
                <strong style="color: #B8975A;">📷 RenderKit Image Optimizer:</strong>
                Bild automatisch optimiert! 
                <strong><?php echo esc_html($stats['original']); ?></strong> → 
                <strong><?php echo esc_html($stats['optimized']); ?></strong>
                (<?php echo esc_html($stats['savings']); ?>% kleiner)
            </p>
        </div>
        <?php
    }

    /**
     * Show WebP regeneration notice
     */
    public function show_webp_regenerated_notice(): void {
        $count = get_transient('rk_webp_regenerated');
        if ($count === false) {
            return;
        }
        delete_transient('rk_webp_regenerated');
        ?>
        <div class="notice notice-success is-dismissible" style="border-left-color: #B8975A;">
            <p>
                <strong style="color: #B8975A;">🖼️ RenderKit WebP:</strong>
                <?php echo esc_html($count); ?> Bilder wurden zu WebP konvertiert! 
                Die Seite lädt jetzt 60-80% schneller.
            </p>
        </div>
        <?php
    }

    /**
     * Check for image manipulation support
     */
    private function has_image_support(): bool {
        return extension_loaded('gd') || extension_loaded('imagick');
    }

    /**
     * Format bytes to human readable
     */
    private function format_bytes(int $bytes): string {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        
        return round($bytes, 1) . ' ' . $units[$i];
    }

    /**
     * Generate WebP versions for all image sizes
     */
    public function generate_webp_versions(array $metadata, int $attachment_id): array {
        if (empty($metadata['file'])) {
            return $metadata;
        }

        $upload_dir = wp_upload_dir();
        $base_dir = trailingslashit($upload_dir['basedir']);
        $file_dir = trailingslashit(dirname($metadata['file']));
        
        // Convert main file
        $main_file = $base_dir . $metadata['file'];
        $this->create_webp($main_file);
        
        // Convert all sizes
        if (!empty($metadata['sizes'])) {
            foreach ($metadata['sizes'] as $size => $data) {
                $file_path = $base_dir . $file_dir . $data['file'];
                $this->create_webp($file_path);
            }
        }

        return $metadata;
    }

    /**
     * Create WebP version of an image
     */
    private function create_webp(string $file_path): bool {
        if (!file_exists($file_path)) {
            return false;
        }

        // Skip if already WebP
        $extension = strtolower(pathinfo($file_path, PATHINFO_EXTENSION));
        if ($extension === 'webp') {
            return false;
        }

        $webp_path = preg_replace('/\.(jpe?g|png)$/i', '.webp', $file_path);

        // Skip if WebP already exists
        if (file_exists($webp_path)) {
            return true;
        }

        // Use Imagick if available
        if (extension_loaded('imagick')) {
            try {
                $image = new \Imagick($file_path);
                $image->setImageFormat('webp');
                $image->setImageCompressionQuality(self::WEBP_QUALITY);
                $image->stripImage();
                $image->writeImage($webp_path);
                $image->destroy();
                return true;
            } catch (\Exception $e) {
                // Fall through to GD
            }
        }

        // Fall back to GD
        if (extension_loaded('gd') && function_exists('imagewebp')) {
            $source = null;
            
            switch ($extension) {
                case 'jpg':
                case 'jpeg':
                    $source = @imagecreatefromjpeg($file_path);
                    break;
                case 'png':
                    $source = @imagecreatefrompng($file_path);
                    break;
            }

            if ($source) {
                $result = imagewebp($source, $webp_path, self::WEBP_QUALITY);
                imagedestroy($source);
                return $result;
            }
        }

        return false;
    }

    /**
     * Serve WebP if browser supports it
     */
    public function maybe_serve_webp($image, int $attachment_id, $size, bool $icon): mixed {
        if (!$image || empty($image[0])) {
            return $image;
        }

        // Check browser support
        if (!$this->browser_supports_webp()) {
            return $image;
        }

        $url = $image[0];
        $webp_url = preg_replace('/\.(jpe?g|png)$/i', '.webp', $url);
        
        // Check if WebP file exists
        $upload_dir = wp_upload_dir();
        $webp_path = str_replace($upload_dir['baseurl'], $upload_dir['basedir'], $webp_url);
        
        if (file_exists($webp_path)) {
            $image[0] = $webp_url;
        }

        return $image;
    }

    /**
     * Add WebP to srcset
     */
    public function add_webp_srcset($sources, $size_array, $image_src, $image_meta, $attachment_id) {
        if (!$this->browser_supports_webp() || empty($sources)) {
            return $sources;
        }

        $upload_dir = wp_upload_dir();
        
        foreach ($sources as $width => $source) {
            $webp_url = preg_replace('/\.(jpe?g|png)$/i', '.webp', $source['url']);
            $webp_path = str_replace($upload_dir['baseurl'], $upload_dir['basedir'], $webp_url);
            
            if (file_exists($webp_path)) {
                $sources[$width]['url'] = $webp_url;
            }
        }

        return $sources;
    }

    /**
     * Check if browser supports WebP
     */
    private function browser_supports_webp(): bool {
        if (!isset($_SERVER['HTTP_ACCEPT'])) {
            return false;
        }
        
        return strpos($_SERVER['HTTP_ACCEPT'], 'image/webp') !== false;
    }

    /**
     * Add regenerate WebP button to admin bar
     */
    public function add_regenerate_webp_button(\WP_Admin_Bar $admin_bar): void {
        if (!current_user_can('manage_options')) {
            return;
        }

        $admin_bar->add_node([
            'id'    => 'renderkit-regenerate-webp',
            'title' => '<span class="ab-icon dashicons dashicons-format-image" style="margin-top:2px;"></span> WebP generieren',
            'href'  => wp_nonce_url(admin_url('admin-post.php?action=rk_regenerate_webp'), 'rk_regenerate_webp'),
            'meta'  => [
                'title' => 'WebP-Versionen für alle Bilder erstellen',
            ],
        ]);
    }

    /**
     * Handle WebP regeneration for all images
     */
    public function handle_regenerate_webp(): void {
        if (!current_user_can('manage_options')) {
            wp_die('Keine Berechtigung');
        }

        if (!wp_verify_nonce($_GET['_wpnonce'] ?? '', 'rk_regenerate_webp')) {
            wp_die('Ungültige Anfrage');
        }

        // Increase time limit
        @set_time_limit(300);

        // Get all image attachments
        $attachments = get_posts([
            'post_type'      => 'attachment',
            'post_mime_type' => ['image/jpeg', 'image/png'],
            'posts_per_page' => -1,
            'post_status'    => 'any',
        ]);

        $count = 0;
        $upload_dir = wp_upload_dir();
        $base_dir = trailingslashit($upload_dir['basedir']);

        foreach ($attachments as $attachment) {
            $metadata = wp_get_attachment_metadata($attachment->ID);
            
            if (empty($metadata['file'])) {
                continue;
            }

            $file_dir = trailingslashit(dirname($metadata['file']));
            
            // Convert main file
            $main_file = $base_dir . $metadata['file'];
            if ($this->create_webp($main_file)) {
                $count++;
            }
            
            // Convert all sizes
            if (!empty($metadata['sizes'])) {
                foreach ($metadata['sizes'] as $size => $data) {
                    $file_path = $base_dir . $file_dir . $data['file'];
                    $this->create_webp($file_path);
                }
            }
        }

        // Store message
        set_transient('rk_webp_regenerated', $count, 30);

        // Redirect back
        wp_safe_redirect(wp_get_referer() ?: admin_url());
        exit;
    }
}

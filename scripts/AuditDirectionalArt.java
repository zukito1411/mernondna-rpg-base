import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Path;
import javax.imageio.ImageIO;

/** CI audit of the real transparent sprite sheets processed during boot. */
public class AuditDirectionalArt {
    record Sheet(String path, int cols, int rows) {}

    private static final Sheet[] SHEETS = {
        new Sheet("public/assets/characters/leigneron/attack.png", 6, 4),
        new Sheet("public/assets/enemies/rindass_orc_range/action.png", 6, 4),
        new Sheet("public/assets/enemies/rindass_orc_range/death.png", 6, 4),
        new Sheet("public/assets/enemies/directional/gray-wolf.png", 5, 4),
        new Sheet("public/assets/enemies/directional/road-bandit.png", 5, 4),
        new Sheet("public/assets/enemies/directional/boarfiend.png", 5, 4),
        new Sheet("public/assets/enemies/directional/marsh-wraith.png", 5, 4),
        new Sheet("public/assets/enemies/directional/cave-troll.png", 5, 4),
        new Sheet("public/assets/enemies/directional/ash-dragon.png", 5, 4),
        new Sheet("public/assets/enemies/rindass_orc_raider/walk.png", 7, 4),
        new Sheet("public/assets/enemies/rindass_orc_range/walk.png", 7, 4)
    };

    private static int alpha(int pixel) { return (pixel >>> 24) & 255; }

    // Mirrors the eight-connected, alpha>64 extraction used by spriteComponents.ts.
    private static int connectedSubjects(int[] pixels, int width, int height) {
        boolean[] visited = new boolean[pixels.length];
        int[] queue = new int[pixels.length];
        int complete = 0;
        for (int start = 0; start < pixels.length; start++) {
            if (visited[start] || alpha(pixels[start]) <= 64) continue;
            int head = 0, tail = 1;
            queue[0] = start;
            visited[start] = true;
            while (head < tail) {
                int pos = queue[head++], x = pos % width, y = pos / width;
                for (int dy = -1; dy <= 1; dy++) for (int dx = -1; dx <= 1; dx++) {
                    int nx = x + dx, ny = y + dy;
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                    int neighbor = ny * width + nx;
                    if (!visited[neighbor] && alpha(pixels[neighbor]) > 64) {
                        visited[neighbor] = true;
                        queue[tail++] = neighbor;
                    }
                }
            }
            if (tail >= 100) complete++;
        }
        return complete;
    }

    private static void audit(Sheet sheet) throws IOException {
        BufferedImage image = ImageIO.read(Path.of(sheet.path()).toFile());
        if (image == null) throw new IOException("Unreadable PNG: " + sheet.path());
        int w = image.getWidth(), h = image.getHeight();
        if (w < sheet.cols() * 20 || h < sheet.rows() * 20 || !image.getColorModel().hasAlpha())
            throw new IOException("Invalid dimensions/transparency: " + sheet.path() + " (" + w + "x" + h + ")");
        int[] pixels = image.getRGB(0, 0, w, h, null, 0, w);
        for (int row = 0; row < sheet.rows(); row++) for (int col = 0; col < sheet.cols(); col++) {
            int visible = 0;
            for (int y = row * h / sheet.rows(); y < (row + 1) * h / sheet.rows(); y++)
                for (int x = col * w / sheet.cols(); x < (col + 1) * w / sheet.cols(); x++)
                    if (alpha(pixels[y * w + x]) > 64) visible++;
            if (visible < 100)
                throw new IOException("Missing pose " + (row * sheet.cols() + col + 1) + " in " + sheet.path() + " (" + visible + " pixels)");
        }
        int expected = sheet.cols() * sheet.rows(), components = connectedSubjects(pixels, w, h);
        System.out.printf("%-24s %4dx%-4d %2d poses, %3d opaque components >=100 (%s)%n",
            Path.of(sheet.path()).getFileName(), w, h, expected, components,
            components < expected ? "grid recovery required" : "normal path possible");
    }

    public static void main(String[] args) throws Exception {
        int failures = 0;
        for (Sheet sheet : SHEETS) {
            try { audit(sheet); }
            catch (Exception e) { failures++; System.err.println("FAILED: " + e.getMessage()); }
        }
        if (failures != 0) throw new IllegalStateException(failures + " incomplete sprite sheets");
        System.out.println("All required directional art contains usable poses.");
    }
}

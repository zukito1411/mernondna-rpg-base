package com.mernondna.rpg;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Save backup file access through Android's Storage Access Framework.
 * No broad storage permission is needed: the player chooses each document.
 */
@CapacitorPlugin(name = "SaveFiles")
public class SaveFilesPlugin extends Plugin {
    private static final int MAX_IMPORT_BYTES = 64 * 1024 * 1024;

    @PluginMethod
    public void exportJson(PluginCall call) {
        String filename = call.getString("filename");
        String content = call.getString("content");
        if (filename == null || content == null || filename.length() > 200) {
            call.reject("Invalid save backup file.");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        intent.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        startActivityForResult(call, intent, "writeDocument");
    }

    @ActivityCallback
    private void writeDocument(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.reject("Backup export cancelled. Your saves were not changed.");
            return;
        }
        Uri uri = data.getData();
        byte[] bytes = call.getString("content", "").getBytes(StandardCharsets.UTF_8);
        try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
            if (output == null) throw new IllegalStateException("Cannot open the selected document.");
            output.write(bytes);
            output.flush();
            JSObject response = new JSObject();
            response.put("saved", true);
            call.resolve(response);
        } catch (Exception error) {
            call.reject("Could not write the backup: " + error.getMessage());
        }
    }

    @PluginMethod
    public void importJson(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        // Some Android document providers label JSON files as text/plain
        // or application/octet-stream. Let the player select their file and
        // validate the contents in the game before importing anything.
        intent.setType("*/*");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        startActivityForResult(call, intent, "readDocument");
    }

    @ActivityCallback
    private void readDocument(PluginCall call, ActivityResult result) {
        if (call == null) return;
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            call.reject("Backup import cancelled. Your saves were not changed.");
            return;
        }
        try (InputStream input = getContext().getContentResolver().openInputStream(data.getData())) {
            if (input == null) throw new IllegalStateException("Cannot open the selected backup.");
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int size;
            while ((size = input.read(buffer)) != -1) {
                if (output.size() + size > MAX_IMPORT_BYTES)
                    throw new IllegalArgumentException("Save backup exceeds the 64 MB limit.");
                output.write(buffer, 0, size);
            }
            JSObject response = new JSObject();
            response.put("content", output.toString(StandardCharsets.UTF_8.name()));
            call.resolve(response);
        } catch (Exception error) {
            call.reject("Could not read the backup: " + error.getMessage());
        }
    }
}

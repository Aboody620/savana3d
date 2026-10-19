export function validateDesignFile(file) {
  if (!file) return 'upload_select_file_error';
  if (!['stl','obj','3mf','step','stp'].includes(file.name.split('.').pop().toLowerCase())) return 'upload_file_type_error';
  if (file.size > 50 * 1024 * 1024) return 'upload_file_size_error';
  if (!file.size) return 'upload_file_empty_error';
  return null;
}
export function validateImageFile(file) {
  if (!file) return null;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return 'upload_image_type_error';
  if (file.size > 5 * 1024 * 1024) return 'upload_image_size_error';
  if (!file.size) return 'upload_file_empty_error';
  return null;
}

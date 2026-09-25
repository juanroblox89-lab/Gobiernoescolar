-- Storage necesita SELECT para que el admin pueda reemplazar o borrar archivos de su carpeta.
create policy "media: admin ve su área" on storage.objects for select to authenticated
  using (bucket_id = 'media' and public.is_area_admin((storage.foldername(name))[1]));

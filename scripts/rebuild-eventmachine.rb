# Build the fixed 1.2.7 event loop without its unused TLS branch and baked-in sample key.
# Website Manager uses localhost HTTP and Node/Git/GitHub CLI for networking.
require 'rubygems'
require 'rubygems/ext'
require 'fileutils'
root = File.expand_path('..', __dir__)
gems = File.join(root, 'runtime/gems/ruby/3.3.0')
Gem.use_paths(gems, [gems, File.join(root, 'runtime/gems')])
spec = Gem::Specification.find_by_name('eventmachine', '= 1.2.7')
file = File.join(spec.full_gem_path, 'ext/extconf.rb')
source = File.read(file)
marker = "if enable_config('ssl', true) # Website Manager optional TLS build\n"
unless source.include?(marker)
  start = "if ENV['CROSS_COMPILING']\n"
  finish = "\nadd_define 'BUILD_FOR_RUBY'"
  raise 'Unexpected EventMachine build source' unless source.scan(start).length == 1 && source.scan(finish).length == 1
  source = source.sub(start, marker + start).sub(finish, "\nend # Website Manager optional TLS build\n" + finish)
  File.write(file, source)
end
# Remove old compiled objects, so rebuilding cannot retain an SSL object from a cache.
Dir.glob(File.join(spec.full_gem_path, 'ext/**/*.{o,bundle,so}')).each { |p| FileUtils.rm_f(p) }
# RubyGems skips moving an extension if a destination file already exists.
# Remove the installed copies too, not just the build objects.
Dir.glob(File.join(spec.extension_dir, '**/*.{bundle,so}')).each { |p| FileUtils.rm_f(p) }
Gem::Ext::Builder.new(spec, ['--disable-ssl']).build_extensions
require 'digest'
Dir.glob(File.join(spec.extension_dir, '**/*.{bundle,so}')).each do |native|
  lib = File.join(spec.full_gem_path, 'lib', File.basename(native))
  raise 'Native extension copies differ' if File.file?(lib) && Digest::SHA256.file(lib).hexdigest != Digest::SHA256.file(native).hexdigest
  raise 'Native extension still embeds a sample key' if File.binread(native).include?('-----BEGIN RSA PRIVATE KEY-----')
end
require 'eventmachine'
raise 'EventMachine TLS must be disabled for the localhost-only manager' if EventMachine.ssl?
puts 'EventMachine 1.2.7 rebuilt: local event loop retained, unused TLS/sample-key branch disabled'

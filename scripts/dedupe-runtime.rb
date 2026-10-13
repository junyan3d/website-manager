require 'pathname'
root=File.expand_path('../runtime/git',__dir__)
groups=Dir.glob(File.join(root,'**','*')).select{|file| File.file?(file)&&!File.symlink?(file)}.group_by{|file| s=File.stat(file);[s.dev,s.ino]}
groups.each_value do |files|
 next if files.size<2
 canonical=files.find{|file| file==File.join(root,'bin/git')}||files.sort.first
 (files-[canonical]).each do |file|
  relative=Pathname.new(canonical).relative_path_from(Pathname.new(File.dirname(file))).to_s
  File.unlink(file)
  File.symlink(relative,file)
 end
end
puts 'Git command aliases use relocatable relative links'
